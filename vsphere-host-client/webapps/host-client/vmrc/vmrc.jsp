<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%@ page import="java.lang.Integer" %>
<%@ page import="java.net.URI" %>
<%@ page import="java.net.URLEncoder" %>
<%@ page import="java.util.ResourceBundle" %>
<%@ page import="com.vmware.vise.util.i18n.ResourceUtil" %>
<%@ page import="com.vmware.vise.util.security.NonceUtil" %>
<%@ page import="com.vmware.vise.vim.commons.VimSessionUtil" %>
<%@ page import="com.vmware.vise.vim.commons.MixedUtil" %>
<%@ page import="com.vmware.vise.vim.commons.VcServiceUtil" %>
<%@ page import="com.vmware.vise.vim.commons.ManagedObjectUtil" %>
<%@ page import="com.vmware.vise.vim.commons.vcservice.VcService" %>
<%@ page import="com.vmware.vim.binding.vmodl.ManagedObjectReference" %>
<%@ page import="com.vmware.vim.binding.vim.SessionManager" %>
<%@ page import="com.vmware.vim.binding.vim.VirtualMachine" %>
<%@ page import="com.vmware.vim.binding.vim.ServiceDirectory.ServiceEndpoint" %>
<%@ page import="com.vmware.vim.binding.vim.ServiceDirectory.ServiceProtocol" %>
<%@ page import="com.vmware.vsphere.client.vmrc.VmrcResources" %>

<%
// TODO: fix i18n (buttons' text).

ManagedObjectReference vmRef = ManagedObjectUtil.stringToMoref(
      request.getParameter("vm"));

URI uri = null;
String host = null;
Integer port = null;
String hostIP = null;
String errorMessage = "";
String serverGuid = vmRef.getServerGuid();
VcService hostVc = VimSessionUtil.getService(serverGuid, session);

if (hostVc != null) {

   uri = URI.create(hostVc.getServiceUrl());
   host = uri.getHost();
   port = uri.getPort();

   if (MixedUtil.isLocalhost(host)) {
      ServiceEndpoint se = VcServiceUtil.getServiceEndpoint(
         vmRef.getServerGuid(),
         ServiceProtocol.vimApi,
         session);
      if (se != null) {
         uri = URI.create(se.url);
         host = uri.getHost();
         port = uri.getPort();
      }
   }

   hostIP = MixedUtil.resolveIpForHost(host);
   if (port > -1) {
      host += ":" + Integer.toString(port);
      if (!hostIP.equals("")) {
         hostIP += ":" + Integer.toString(port);
      }
   }

} else {
   errorMessage = VmrcResources.getLocalizedString("error.hostNotFound");
}

String title = "";
try {
   VirtualMachine vm = ManagedObjectUtil.getManagedObject(vmRef, session);
   title = vm.getName();

   // ManagedEntity's getName() escapes slashes, backslashes and percents (see VMODL).
   // Because of that, unescape these symbols, before URL-encoding the string.
   title = title.replaceAll("(?i)%2f", "/")
         .replaceAll("(?i)%5c", "\\\\")
         .replace("%25", "%");
   // URL-encode the string, making sure that "space" gets escaped as '%20' and not '+'
   title = URLEncoder.encode(title, "UTF-8").replace("+", "%20");

} catch (Exception ex) {
   errorMessage = ex.getMessage();
}

// Debug turned on?
boolean debug = Boolean.parseBoolean(request.getParameter("debug"));
String nonce = NonceUtil.createNonce(request.getSession(true));

String titleSuffix        = VmrcResources.getLocalizedString("title.suffix");
String CAhint             = VmrcResources.getLocalizedString("CAD.hint");
String CADCommand         = VmrcResources.getLocalizedString("CAD.command");
String FSCommand          = VmrcResources.getLocalizedString("FS.command");
String connecting         = VmrcResources.getLocalizedString("state.connecting");
String disconnectedInfo   = VmrcResources.getLocalizedString("warning.disconnected");
String pluginNotInstalled = VmrcResources.getLocalizedString("error.pluginNotInstalled");
%>

<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<link type="image/x-icon" href="../assets/application.ico" rel="shortcut icon">
<link rel="stylesheet" type="text/css" href="assets/vmrc.css" />
<script type="text/javascript" src="assets/raphael.min.js"></script>
<script type="text/javascript" src="../assets/jquery.min.js"></script>

<script type="text/javascript">
var vmrc = null;
var ticket = null;
var vmNameTooltip = null;
var tooltipTimeout = null;
var resizeTimeout = null;
var removeSpinnerCb = null;
var SCROLLBAR_WIDTH = null;

if (window.console == undefined || window.console.debug == undefined) {

   window.console = {
      debug: function(msg){},
      info: function(msg){},
      warn: function(msg){},
      error: function(msg){}
   }

<% if (debug) { %>
   $.getScript("https://getfirebug.com/firebug-lite.js#startOpened");
<% } %>

}

// decodeURIComponent() converts the "URLEncoded" string back to normal
var title = decodeURIComponent("<%= title %>");
// VMRC ERROR MESSAGES
var UNRESOLVABLE_ERROR  = /The server name could not be resolved/mi;

// VMRC EVENTS
var GS_GRABBED        = null;
var GS_UNGRABBED_HARD = null;
var GS_UNGRABBED_SOFT = null;

var MT_HINT           = null;
var MT_INFO           = null;
var MT_WARN           = null;
var MT_ERROR          = null;

var CS_DISCONNECTED   = null;
var CS_CONNECTED      = null;

var VMRC_MKS          = null;
var VMRC_EVENT_MESSAGES = null;

var previousWidth       = 0;
var previousHeight      = 0;
var vmrcSizeInitialized = false;
var timer               = null;
var hostIp              = "<%= hostIP %>";

function onMessage(type, msg) {
   // Suppress unresolvable errors (handled by a fallback in connect) coming from Linux
   if (msg.match(UNRESOLVABLE_ERROR)) {
      return;
   }
   var prefix = isNaN(type) ? type + ": " : "";
   alert(prefix + msg);
}

/**
 * Callback to handle sizeChanged events from the plugin
 */
function onSizeChanged(width, height) {
   if (width == 0 || height == 0) {
      console.debug("VMRC sizeChanged callback called with width or height as 0");
   }
   updateVmrcSize(width, height);
}

/**
 * Timer to poll for size changes in the vmrc
 */
function sizeTimerCallback() {
   var width = 0;
   var height = 0;
   try {
      //Pull the width and the height directly from the vmrc object
      width = vmrc.screenWidth();
      height = vmrc.screenHeight();
      updateVmrcSize(width, height);
   } catch (err) {
      //Restart the timer if either getting the width or the height errored
      setupSizeTimer(width, height, 1000);
   }
}

function setupSizeTimer(width, height, time) {
   if (vmrcSizeInitialized) {
      return;
   }
   //The size meets a minimum, stop polling
   if (width > 10 && height > 10) {
      clearTimeout(timer);
      timer = null;
      vmrcSizeInitialized = true;
      return;
   }
   timer = setTimeout(sizeTimerCallback, time);
}

function updateVmrcSize(width, height) {
   console.debug("VMRC: size changed: " + width + "x" + height);
   //Setting either the width or height to 0 will not work
   if (width > 0 && height > 0) {
      if (width != previousWidth || height != previousHeight) {
         $(vmrc).width(width);
         $(vmrc).height(height);
         previousWidth = width;
         previousHeight = height;
         alignConsole();
      }
   }
   //Attempt to poll for a new size if necessary
   setupSizeTimer(width, height, 1000);
}

function connectWithIP(reason) {
   if (hostIp != "" && reason.match(UNRESOLVABLE_ERROR)) {
      console.debug("Attempting fallback connection to host via IP");
      var hip = hostIp;
     //clear the hostIP so only one attempt is made
      hostIp = "";
      connectVmrc(hip);
      return true;
   }
   return false;
}

function onConnectionStateChanged(cs, host, datacenter, vmId, userRequested, reason) {
   console.debug("VMRC: connection state changed: " + cs);

   if (cs == CS_CONNECTED) {
      hideSpinner();
      //Set a timeout to check for the size changed event in case it is missed.
      setupSizeTimer(0, 0, 250);
      $("#hint").text("<%= CAhint %>");
      $("#hint").fadeTo("fast", 0.5);
   } else {
      setTimeout(function() {
         if (reason != null && reason.length > 0) {
             if (connectWithIP(reason)) {
                 return;
             }
            alert(reason);
         } else {
            alert("<%= disconnectedInfo %>");
         }
         vmrc.shutdown();
         window.opener = self;
         window.close();
      }, 0);
   }
}

function onGrabStateChanged(state) {
   console.debug("VMRC: grab state changed: " + state);
   // Only show "Ctrl-Alt" hint when the mouse is grabbed
   var hint = $("#hint");

   if (state == GS_GRABBED) {
      hint.text("<%= CAhint %>");
      hint.fadeTo("fast", 1.0);
   } else if (state == GS_UNGRABBED_SOFT || state == GS_UNGRABBED_HARD ||
         state == "ungrabbedHard" || state == "ungrabbedSoft") {
      hint.fadeTo("slow", 0.5);
   }
}

// EVENT HANDLERS

function onWindowResized(event) {
   clearTimeout(resizeTimeout);
   resizeTimeout = setTimeout(resizeContainer, 300);
}

function isVmrcReady() {
      return vmrc != null && vmrc.isReadyToStart();
}

function fullScreen() {
   if (vmrc != null) {
      vmrc.setFullscreen(true);
   }
}

function sendCAD() {
   if (vmrc != null) {
      vmrc.sendCAD();
   }
}

function getURLParameter(name) {
	// Returns the value of a parameter in the url (?parameter=value) or (&parameter=value)
    return decodeURIComponent(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
	);
}

function openHtmlConsole() {
	var url = getURLParameter("htmlConsoleUrl")
	+ "&vmName=" + getURLParameter("vmName")
	+ "&installVMRC=" + getURLParameter("installVMRC")
	+ "&host=" + getURLParameter("host")
	+ "&sessionTicket=" + getURLParameter("sessionTicket")
	+ "&thumbprint=" + getURLParameter("thumbprint");
	location.href = url;
}

function backToClient() {
   var url =
      window.location.protocol + "//" + window.location.host + "/vsphere-client/?"
      + "#extensionId=vsphere.core.vm.summaryView;context=com.vmware.core.model%3A%3A"
      + "ServerObjectRef~<%= vmRef.getServerGuid() %>%3A<%= vmRef.getType() %>%3A"
      + "<%= vmRef.getValue() %>";

   if (window.opener) {
      window.opener.location = url;
   } else {
      window.open(url);
   }
}

function getTarget(event) {
   return $(event.target).parents(".button");
}

function mouseOutHandler(e) {
   var target = getTarget(e);
   if (target == null) {
      return;
   }
   target.children("div").removeClass('box_hover').removeClass('box_pressed');
}

function mouseOverHandler(e) {
   var target = getTarget(e);
   if (target == null) {
      return;
   }
   target.children("div").addClass('box_hover');
}

function mouseDownHandler(e) {
   var target = getTarget(e);
   if (target == null) {
      return;
   }
   target.children("div").removeClass('box_hover').addClass('box_pressed');
}

function mouseUpHandler(e) {
   var target = getTarget(e);
   if (target == null) {
      return;
   }
   target.children("div").removeClass('box_pressed').addClass('box_hover');
}

function selectStartHandler(e) {
   return false;
}

function dragStartHandler(e) {
   return false;
}

function registerButton(buttonId, clickHandler) {
   var button = $("#" + buttonId);

   button.click(clickHandler);
   button.mouseout(mouseOutHandler);
   button.mouseover(mouseOverHandler);
   button.mousedown(mouseDownHandler);
   button.mouseup(mouseUpHandler);
   button.bind('selectstart', selectStartHandler);
   button.bind('dragstart', dragStartHandler);

   // mark the top level DOM element as a "button" class
   button.addClass("button");
}

function scrollbarWidth() {
   var div = $('<div style="width:50px;height:50px;overflow:hidden;position:abso' +
               'lute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
   // Append div, do calculation and then remove it
   $("body").append(div);
   var w1 = $("div", div).innerWidth();
   div.css('overflow-y', 'scroll');
   var w2 = $("div", div).innerWidth();
   $(div).remove();
   return (w1 - w2);
}

function resizeContainer() {
   // set height
   $("#container").height( $(window).height() - $("#container").offset().top );

   // set width
   $("#container").width( $(window).width() );

   // align console
   alignConsole();
}

function alignConsole() {
   var cw = $("#container").width();
   var vw = $(vmrc).width();
   var ch = $("#container").height();
   var vh = $(vmrc).height();
   var offX = 1;
   var offY = $("#container").offset().top;

   /* Force add/remove scrollbars (FF issue) */

   var xScrollOn, yScrollOn = false;
   var xDiff, yDiff = 0;

   yDiff = ch - vh;
   xDiff = cw - vw;

   yScrollOn = yDiff <= 0;
   xScrollOn = xDiff <= 0;

   if (SCROLLBAR_WIDTH == null) {
      SCROLLBAR_WIDTH = scrollbarWidth();
   }
   // Enabling one scrollbar could trigger the other dimension to be clipped...
   if (yScrollOn && xDiff < SCROLLBAR_WIDTH) {
      xScrollOn = true;
   }
   if (xScrollOn && yDiff < SCROLLBAR_WIDTH) {
      yScrollOn = true;
   }

   // Compensate for scroll bars
   if (yScrollOn) { xDiff -= SCROLLBAR_WIDTH; }
   if (xScrollOn) { yDiff -= SCROLLBAR_WIDTH; }

   // Set the CSS directives
   var xVal = xScrollOn ? "scroll" : "hidden";
   var yVal = yScrollOn ? "scroll" : "hidden";

   /* Position the console */

   if (cw > vw) {
      offX += Math.floor(xDiff / 2);
   }
   if (ch > vh) {
      offY += Math.ceil(yDiff / 3);
   }

   $(vmrc).css("margin-left", offX + "px");
}

function justifyButtonWidths() {
   $("#buttonBar").children().each( function() {
      var button = $(this);
      var r = $(button.children(".buttonR")[0]).width();
      var c = $(button.children(".buttonC")[0]).width();
      var l = $(button.children(".buttonL")[0]).width();
      button.width(l + c + r + 1);
   });
}

function showTooltip() {
   if (tooltipTimeout != null) {
      clearTimeout(tooltipTimeout);
      tooltipTimeout = null;
   }
   $("#vmNameTooltip").show();
}

function hideTooltip() {
   tooltipTimeout = setTimeout('$("#vmNameTooltip").fadeOut("slow")', 600);
}

function showSpinner() {
   // Use Raphael's Spinner --> raphael.min.js
   // constructor args: holderid, R1, R2, count, stroke_width, colour
   removeSpinnerCb = spinner("spinner", 16, 24, 12, 5, "#fff");
   $("#glassPane").fadeTo(0, 0.3);
   $("#spinner").show();
}

function hideSpinner() {
   $("#spinner").hide();
   removeSpinnerCb();
   $("#glassPane").hide();
}

function connectVmrc(hostname) {
   try {
       console.info("connecting to " + hostname);
       vmrc.connect(hostname, "", true, ticket, "", "", "<%= vmRef.getValue() %>", "", "");
       console.info("vmrc.connect() succeeded.");
   } catch (err) {
      console.error("vmrc.connect() failed");
   }
}

function initVmrc() {
   var errorMessage = '<%= errorMessage %>';

   // In case of an error, show the error to the user and abort.
   if (errorMessage.length > 0) {
      alert(errorMessage);
      return;
   }
   // Keep retrying as long as VMRC is not ready
   if (!isVmrcReady()) {
      setTimeout(initVmrc, 100);
      console.debug("VMRC: initVmrc to retry " + new Date().getTime());
      return;
   }
   console.debug("VMRC: is ready to start.");

   if ($.browser.msie) {
      vmrc.attachEvent("onScreenSizeChange", onSizeChanged);
      vmrc.attachEvent("onConnectionStateChange", onConnectionStateChanged);
      vmrc.attachEvent("onGrabStateChange", onGrabStateChanged);
      vmrc.attachEvent("onMessage", onMessage);
   } else {
      vmrc.onScreenSizeChange = onSizeChanged;
      vmrc.onConnectionStateChange = onConnectionStateChanged;
      vmrc.onGrabStateChange = onGrabStateChanged;
      vmrc.onMessage = onMessage;
   }

   //Startup VMRC
   var startupId = vmrc.startup(VMRC_MKS, VMRC_EVENT_MESSAGES, "");

   if (!startupId) {
      console.error("vmrc.startup() failed");
      return;
   }

   console.info("VMRC Started: " + startupId);

   //Retrieve a ticket
   $.ajax({
      url: "ticket.jsp?nonce=<%= nonce %>&serverGuid=<%= serverGuid %>",
      async: false,
      cache: false,
      success: function(data, textStatus, jqXHR) {
         if (data.error != "") {
            throw new Error('<%= VmrcResources.getLocalizedString("error.ticketGeneration") %> ' + data.error);
         }
         ticket = data.ticket;

      },
      error: function(jqXHR, textStatus, errorThrown) {
         console.error(jqXHR.responseText);
         throw new Error('<%= VmrcResources.getLocalizedString("error.ticketRequest") %>');
      }
   });
   //Connect
   connectVmrc("<%= host %>");
}


var isIE = /MSIE (\d+\.\d+);/.test(navigator.userAgent);

function getConstant(constantType, constantName) {
   if (isIE) {
      return vmrc[constantType](constantName);
   }
   return vmrc[constantType][constantName];
}

function loadVmrcObject(){
   var container = document.getElementById("container");
   if(isIE) {
      container.innerHTML = "<object id='vmrc' classid='CLSID:4AEA1010-0A0C-405E-9B74-767FC8A998CB'></object>" ;
   } else {
      container.innerHTML = "<object id='vmrc' type='application/x-vmware-remote-console-2012'></object>" ;
   }
}

// INITIALIZE
$(document).ready(function(){
try {
   // Show spinner overlay
   showSpinner();

   // Workaround for IE10 problem. vmrc object can not be statically defined
   // using <!--<[if IE]--><!-- --> since IE10 does not recognise CC's.
   // So now all browsers will define vmrc object this way.
   loadVmrcObject();

   // Start up VMRC
   vmrc = document.getElementById("vmrc");
   if (vmrc == null) {
      //Short circuit if the vmrc element was not found
      return;
   }

   //pull out the constants
   GS_GRABBED        = getConstant("VMRC_GrabState", "VMRC_GS_GRABBED");
   GS_UNGRABBED_HARD = getConstant("VMRC_GrabState", "VMRC_GS_UNGRABBED_HARD");
   GS_UNGRABBED_SOFT = getConstant("VMRC_GrabState", "VMRC_GS_UNGRABBED_SOFT");

   MT_HINT           = getConstant("VMRC_MessageType", "VMRC_MESSAGE_HINT");
   MT_INFO           = getConstant("VMRC_MessageType", "VMRC_MESSAGE_INFO");
   MT_WARN           = getConstant("VMRC_MessageType", "VMRC_MESSAGE_WARNING");
   MT_ERROR          = getConstant("VMRC_MessageType", "VMRC_MESSAGE_ERROR");

   CS_DISCONNECTED   = getConstant("VMRC_ConnectionState", "VMRC_CS_DISCONNECTED");
   CS_CONNECTED      = getConstant("VMRC_ConnectionState", "VMRC_CS_CONNECTED");

   VMRC_MKS          = getConstant("VMRC_Mode", "VMRC_MKS");
   VMRC_EVENT_MESSAGES  = getConstant("VMRC_MessageMode", "VMRC_EVENT_MESSAGES");

   vmNameTooltip = $("#vmNameTooltip");
   var vmTitle = $("#vmTitle");

   // set the title strings on the page
   document.title = title;
   vmTitle.text(title);
   vmNameTooltip.text(title);

   // Attach event listeners
   $(window).resize(onWindowResized);
   registerButton("fullScreenButton", fullScreen);
   registerButton("cadButton", sendCAD);

   // Register tool tip
   $("#vmName").hover(showTooltip, hideTooltip);
   $("#vmNameTooltip").hover(showTooltip, hideTooltip);

   // Adjust CSS geometry
   $("#buttonBar").height( $("#container").offset().top );

   initVmrc();
} catch (error) {
   hideSpinner();
   console.error(error);

   // Only alert if the plugin is installed
   if (vmrc != null && vmrc.isReadyToStart != null) {
      alert(error);
      $("#hint").text("");
   } else {
      $("#hint").text("<%= pluginNotInstalled %>");
   }
}
});

$(window).load(function() {
   // This fixes IE7's inability to assign correct widths
   justifyButtonWidths();
});


// UNLOAD
$(document).unload(function(){
   if (vmrc != null) {
      vmrc.disconnect();
      vmrc = null;
   }
});
</script>
</head>
<body>
   <div id="buttonBar">

	  <div id="fullScreenButton" class="buttonT">
         <div class="buttonR">&nbsp;</div>
         <div class="buttonC"><%= FSCommand %></div>
         <div class="buttonL">&nbsp;</div>
      </div>

      <div id="cadButton" class="buttonT">
         <div class="buttonR">&nbsp;</div>
         <div class="buttonC"><%= CADCommand %></div>
         <div class="buttonL">&nbsp;</div>
      </div>

   </div>

   <div id="vmName">
      <span id="vmTitle"><!-- filled programmatically --></span>
   </div>

   <div id="vmNameTooltip"><!-- filled programmatically --></div>

   <div id="hint"><%= connecting %></div>

   <div id="container"></div>

   <div id="glassPane"></div>
   <div id="spinner"></div>
</body>
</html>
