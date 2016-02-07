<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<%@ page import="com.vmware.vsphere.client.error.ErrorConstants" %>
<%@ page import="com.vmware.vsphere.client.common.error.ErrorReportData" %>
<%@ page import="com.vmware.vise.data.common.NameValuePair" %>
<%@ page import="com.vmware.vise.util.ArrayUtil" %>
<%
/**
 * Copyright 2011 VMware, Inc.  All rights reserved. -- VMware Confidential
 */
ErrorReportData data = (ErrorReportData)request.getAttribute("reportData");
NameValuePair[] eventItems = data.eventItemList;
NameValuePair[] eventDetails = data.eventDetailList;
NameValuePair[] taskItems = data.taskItemList;
NameValuePair[] taskDetails = data.taskDetailList;
NameValuePair[] faultItems = data.faultItemList;
NameValuePair[] faultDetails = data.faultDetailList;
String[] stackTrace = data.stackTrace;
String[] stackTraceTabs = data.stackTraceTabs;
String colon = text("ErrorReportJsp.colon");
%>
<%!
public static String text(String key, String ... args) {
   return ErrorConstants.text(key, args);
}
%>
<html>
<head>
   <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
   <meta http-equiv="CACHE-CONTROL" content="PUBLIC"/>
   <meta http-equiv="EXPIRES" content="Mon, 22 Jul 2100 11:12:01 GMT"/>
   <link rel="stylesheet" href="assets/askvmwaremain.css" type="text/css" />
   <link rel="stylesheet" href="assets/askvmwareprint.css" media="print" type="text/css" />
   <script src="assets/jsutil.js" type="text/javascript"></script>
   <title><%=text("ErrorReportJsp.header.label")%></title>
<style type="text/css" media="screen">
#scrollDiv {
   height:350px;
}
</style>

<style type="text/css" media="print">
#buttonBar {
   display: none;
}
</style>
<script type="text/javascript">
<!--
function onResizeWin() {
   var BROWSER_PADDING = 5; // padding browser adds to bottom
   var CONTENT_PADDING = 32; // for the top + bottom of the content.
   winDim = getWindowSize();

   sDiv = getObject('scrollDiv'); // scroll region
   frm = getObject('formDiv'); // button form at bottom
   mDiv = getObject('messageDiv'); // save / print button area.
   wwrap = getObject('wrapper'); // right above the save + print

   size = winDim.height - mDiv.offsetHeight - frm.offsetHeight -
         wwrap.offsetTop - BROWSER_PADDING - CONTENT_PADDING;

   if (size < 200) {
      size = 200;
   }

   sDiv.style.height = size.toString() + "px";
}
window.onresize = onResizeWin;
// -->
</script>
</head>
<body style="width:100%;min-width:800px" onload="onResizeWin()">
   <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="position:absolute;width:100%;padding: 0px 0px 0px 0px">
   <tr>
      <td width="100%" valign="middle">
         <table width="100%" cellpadding="0" cellspacing="0" border="0" height="27"
            style="width:100%;padding: 0px 16px 0px 0px">
         <tr>
            <td width="100%" valign="middle" class="headerText"><%=text("ErrorReportJsp.header.label")%></td>
            <td nowrap valign="middle"><img src="assets/vmw_logo_trsp.png" width="76" height="12" alt="VMware"/></td>
         </tr>
         </table>
         <table border="0" cellpadding="0" cellspacing="0" height="87"
            style="padding: 0px 0px 0px 16px">
         <tr>
            <td valign="middle" width="100%">
            <div class="subHeaderText"><%=text("ErrorReportJsp.prompt")%></div>
            <ul class="headerList">
               <li class="headerItem"><%=text("ErrorReportJsp.purposeGetKB")%></li>
               <li class="headerItem"><%=text("ErrorReportJsp.purposeReport")%></li>
            </ul>
            </td>
         </tr>
         </table>
      </td>
   </tr>
   </table>
   <div><img src="assets/header_tile.png" width="100%" height="27" alt=""/></div>
   <table border="0" cellpadding="0" cellspacing="0" width="100%" height="87">
   <tr>
      <td width="100%"><img src="assets/banner_tile.png" width="100%" height="87" alt=""/></td>
      <td width="302"><img src="assets/banner_pattn_rt_side.png" width="302" height="87" alt="VMware"/></td>
   </tr>
   </table>
<div id="wrapper" style="width:99%">
   <div class="contentRegion">
   <div id="messageDiv" class="measureDiv">
		<p id="buttonBar" style="margin: 0px 8px 8px 8px">
		   <a href="javascript:window.print()"><%=text("ErrorReportJsp.print.label")%></a>
		   | <%=text("ErrorReportJsp.save.label")%>
		</p>
   </div>
      <div id="scrollDiv" class="scrollRegion">
         <div class="scrollContents">
         <table border="0">
            <% if (!ArrayUtil.isNullOrEmpty(eventItems)){ %>
            <tr><td colspan="2"><b><%=text("ErrorReportJsp.eventDetails.label")%></b></td></tr>
            <tr><td>&nbsp;</td>
            <td>
               <table border="0">
               <% for(NameValuePair item:eventItems) {%>
                  <tr><td valign="top"><%=item.name%><%=colon%></td><td><%=item.value%></td></tr>
               <% } %>
               </table>
               <br/>
            </td></tr>
            <% } %>

            <% if (!ArrayUtil.isNullOrEmpty(taskItems)){ %>
            <tr><td colspan="2"><b><%=text("ErrorReportJsp.taskDetails.label")%></b></td></tr>
            <tr><td>&nbsp;</td>
            <td>
               <table border="0">
               <% for(NameValuePair item:taskItems) {%>
                  <tr><td valign="top"><%=item.name%><%=colon%></td><td><%=item.value%></td></tr>
               <% } %>
               </table>
               <br/>
            </td></tr>
            <% } %>

            <% if (!ArrayUtil.isNullOrEmpty(faultItems)){ %>
            <tr><td colspan="2"><b><%=text("ErrorReportJsp.faultDetails.label")%></b></td></tr>
            <tr><td>&nbsp;</td>
            <td>
               <table border="0">
               <% for(NameValuePair item:faultItems) {%>
                  <tr><td valign="top"><%=item.name%><%=colon%></td><td><%=item.value%></td></tr>
               <% } %>
               </table>
               <br/>
            </td></tr>
            <% } %>

            <tr><td colspan="2"><b><%=text("ErrorReportJsp.errorStack.label")%></b></td></tr>
            <tr><td>&nbsp;</td><td>
            <% for (int i = 0; i < stackTrace.length; i++) {
               String msg = stackTrace[i];
               String tabs = stackTraceTabs[i];
            %>
               <div><span><%=tabs%></span>
               <span class="errorImage"><img src="assets/errorStack.png"></span>
               <span><%=msg%></span></div>
            <% } %>
            <br/>
            </td></tr>

            <% if (!ArrayUtil.isNullOrEmpty(eventDetails)){ %>
            <tr><td colspan="2"><b><%=text("ErrorReportJsp.eventDetailsEx.label")%></b></td></tr>
            <tr><td>&nbsp;</td>
            <td>
               <table border="0">
               <% for(NameValuePair item:eventDetails) {%>
                  <tr><td valign="top"><%=item.name%><%=colon%></td><td><%=item.value%></td></tr>
               <% } %>
               </table>
               <br/>
            </td></tr>
            <% } %>

            <% if (!ArrayUtil.isNullOrEmpty(taskDetails)){ %>
            <tr><td colspan="2"><b><%=text("ErrorReportJsp.taskDetailsEx.label")%></b></td></tr>
            <tr><td>&nbsp;</td>
            <td>
               <table border="0">
               <% for(NameValuePair item:taskDetails) {%>
                  <tr><td valign="top"><%=item.name%><%=colon%></td><td><%=item.value%></td></tr>
               <% } %>
               </table>
               <br/>
            </td></tr>
            <% } %>

            <% if (!ArrayUtil.isNullOrEmpty(faultDetails)){ %>
            <tr><td colspan="2"><b><%=text("ErrorReportJsp.faultDetailsEx.label")%></b></td></tr>
            <tr><td>&nbsp;</td>
            <td>
               <table border="0">
               <% for(NameValuePair item:faultDetails) {%>
                  <tr><td valign="top"><%=item.name%><%=colon%></td><td><%=item.value%></td></tr>
               <% } %>
               </table>
               <br/>
            </td></tr>
            <% } %>
         </table>
         </div>
      </div>
      <div id="formDiv" class="measureDiv">
      <p><%=text("ErrorReportJsp.support")%></p>
      <form id="form1" action="<%=text("ErrorReportJsp.postSite")%>" method="post"
         style="padding: 0px 0px 0px 0px;margin:0px 0px 0px 0px">
      <input type="hidden" name="DEST" value="AskVMware" />
      <input type="hidden" name="HEADER" value="True" />
      <input type="hidden" name="DATA" value="<%=data.urlEncodedData%>" />
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr><td width="100%"><%=text("ErrorReportJsp.supportAndDataCollection")%></td>
      <td nowrap><input type="submit" name="SUBMIT"
         value="<%=text("ErrorReportJsp.submit.label")%>" />
         <input type="button" value="<%=text("ErrorReportJsp.cancel.label")%>" onclick="window.close()"/>
      </td></tr></table>
      </form>
      </div>
</div></div></body></html>
