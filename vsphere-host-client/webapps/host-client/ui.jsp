<%@ page contentType="text/html;charset=utf-8"
   import="java.util.Locale,
            java.util.Enumeration,
            java.util.regex.Pattern,
            java.net.URLEncoder,
            com.vmware.vise.util.StringUtil,
			com.vmware.vise.util.i18n.ResourceUtil" %><%

   // Defines the IE document capability
   response.setHeader("X-UA-Compatible", "IE=edge");

   // Force same origin to prevent click-jacking attacks with an iframe
   response.setHeader("X-Frame-Options", "SAMEORIGIN");

   // Disables caching
   response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
   response.setHeader("Pragma", "no-cache");
   response.setDateHeader("Expires", 0);

   String wmode = "window"; // default
   Boolean accessible = (Boolean) session.getAttribute("accessible");
   // wmode value of 'opaque' or 'transparent' may cause the Flash movie to
   // be invisible to assistive technologies such as a screen reader.
   if (accessible != null && ! accessible) {
      wmode = "opaque";
   }

   Locale locale = (Locale) session.getAttribute("applicationLocale");
   String encodedLocale = URLEncoder.encode(locale == null ? "" : locale.toString());
   StringBuffer flashvars = new StringBuffer("locale=").append(encodedLocale);

   String localeChain = ResourceUtil.getVerifiedAppLocale(request).toString();
   String encodedLocaleChain = URLEncoder.encode(localeChain);
   String resourceModule = "locales/UI-" + encodedLocaleChain + ".swf";

   // Includes the resource module only if it exists
   if (application.getRealPath(resourceModule) != null) {
      flashvars.append("&amp;").append("localeChain=").append(encodedLocaleChain);
      flashvars.append("&amp;").append("resourceModuleURLs=").append(resourceModule);
   }

   Enumeration<String> names = request.getParameterNames();

   while(names.hasMoreElements()) {
      String name = names.nextElement();
      String value = request.getParameter(name);
      if ("locale".equals(name)) {
         // Prevent the duplication of the locale param.
         continue;
      }
      // URL Encoding is needed to fix bug # 1001328
      String encodedName = URLEncoder.encode(name);
      String encodedValue = URLEncoder.encode(value);
      flashvars.append("&amp;").append(encodedName).append("=").append(encodedValue);
   }

   String swf = "UI";
   boolean debugBuild = !"false".equals("false");
   if (!debugBuild && "true".equals(request.getParameter("debug"))) {
      swf += "-debug";
   }

   String missingFlashMessage = "${missingFlashMessage}";
   // When the template variable is not passed, the ${.. token will not be
   // replaced, hence doing the following check.
   if (missingFlashMessage.startsWith("${")) {
      missingFlashMessage = "";
   } else {
      missingFlashMessage = "<p>" + missingFlashMessage + "</p>";
   }

%><!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- saved from url=(0014)about:internet -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
   <head>
      <title>vSphere Web Client on Linux</title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <style type="text/css" media="screen">
         html, body {
            height: 100%;
            overflow: auto;
            margin: 0;
            padding: 0;
            font: 13px Arial, 'Helvetica Neue', sans-serif;
         }
         p {
            margin: 20px;
            padding: 0;
         }
         img {
            border: 0;
         }
         #flashContent {
            display: none;
         }
         #container_app {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            outline: none;
         }
	#cus-menu {
		position: absolute;
		left: 0;
		top: 50%;
		width: 5px;
		height: 50px;
		background-color: #fff;
		z-index: 999;
		cursor: pointer;
		border-radius: 0px 4px 4px 0px;
	}
      </style>
      <link type="text/css" href="history/history.css" rel="stylesheet" />
      <link rel="stylesheet" type="text/css" href="assets/pull-menu/css/jPushMenu.css" />
      <link type="image/x-icon" href="assets/application.ico" rel="shortcut icon"/>
      <script type="text/javascript" src="history/history.js"></script>
      <script type="text/javascript" src="assets/swfobject.js"></script>
      <script type="text/javascript" src="assets/jquery.min.js"></script>
      <script type="text/javascript" src="assets/jquery.scrollbars.js"></script>
      <script type="text/javascript" src="assets/angular.min.js"></script>
      <script type="text/javascript" src="assets/ng-grid-2.0.7.min.js"></script>

      <!-- custom menu -->
      <script type="text/javascript" src="assets/pull-menu/js/jPushMenu.js"></script>
      <script>
	jQuery(document).ready(function($) {
	$('.toggle-menu').jPushMenu();
	});
      </script>
      <% // TODO mthirunavukkar inject this from flex at the end of Code Complete %>
      <script type="text/javascript" src="ovf-ui/assets/scripts/ovfWizardInitializer.js"></script>
      <script type="text/javascript">
      //<![CDATA[
         swfobject.embedSWF(
            '<%= swf %>.swf',
            'flashContent',
            '100%',
            '100%',
            '11.5.0',
            'playerProductInstall.swf',
             false, {
               quality: 'high',
               bgcolor: '#ffffff',
               allowscriptaccess: 'sameDomain',
               allowfullscreen: 'true',
               menu: false,
               flashvars: '<%= flashvars.toString().replaceAll("&amp;", "&") %>',
               scale: 'noscale',
               wmode: '<%= wmode %>'
            }, {
               id: 'container_app',
               name: 'container_app',
               align: 'middle'
            });
         swfobject.createCSS('#flashContent', 'display: block; text-align: left;');
         $.scrollbars({
            swfId: '#container_app'
         });
      //]]>
      </script>
   </head>
   <body>
      <div id="container"></div>
      <div id="flashContent">
         <p>
            To view this page ensure that Adobe Flash Player version
            11.5.0 or greater is installed.
         </p>
         <p>
            <a href="http://www.adobe.com/go/getflashplayer">
               <img src="assets/getFlashPlayer.gif" alt="Get Adobe Flash Player" />
            </a>
         </p><%= missingFlashMessage %>
      </div>
      <noscript>
         <object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%" id="container_app">
            <param name="movie" value="<%=swf%>.swf" />
            <param name="flashvars" value="<%= flashvars %>"/>
            <param name="quality" value="high" />
            <param name="bgcolor" value="#ffffff" />
            <param name="allowScriptAccess" value="sameDomain" />
            <param name="allowFullScreen" value="true" />
            <!--[if !IE]>-->
            <object type="application/x-shockwave-flash" data="<%=swf%>.swf" width="100%" height="100%">
               <param name="flashvars" value="<%= flashvars %>"/>
               <param name="quality" value="high" />
               <param name="bgcolor" value="#ffffff" />
               <param name="allowScriptAccess" value="sameDomain" />
               <param name="allowFullScreen" value="true" />
            <!--<![endif]-->
            <!--[if gte IE 6]>-->
               <p>
                  Either scripts and active content are not permitted to run or Adobe Flash Player version
                  11.5.0 or greater is not installed.
               </p>
            <!--<![endif]-->
               <p>
                   <a href="http://www.adobe.com/go/getflashplayer">
                      <img src="assets/getFlashPlayer.gif" alt="Get Adobe Flash Player" />
                   </a>
               </p>
            <!--[if !IE]>-->
            </object>
            <!--<![endif]-->
         </object>
      </noscript>
   </body>
</html>
