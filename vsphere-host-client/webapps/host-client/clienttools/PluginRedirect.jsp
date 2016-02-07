<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
<script type="text/javascript">
var cipVersion = "6.0.0.1887270";
var versionTokens = cipVersion.split(".");
var cipBuildNum = versionTokens[3];
var cipBuildVersion = versionTokens[0] + "." + versionTokens[1] + "." + versionTokens[2];

function createBuildUrl() {
   var urlPath = "";
   for (var i = 0; i < cipBuildNum.length; i++) {
      urlPath += cipBuildNum.charAt(i) + "/";
   }
   return urlPath;
}

function getExtension() {
   var os = navigator.appVersion;
   if (os.indexOf("Mac") != -1) {
      return "mac64.dmg";
   } else if (os.indexOf("Linux")!=-1 || os.indexOf("X11")!=-1) {
      var platform = navigator.platform;
      if (platform.indexOf("x86_64") != -1) {
         return "x86_64.bundle";
      } else {
         return "i386.bundle";
      }
   } else {
      return "exe";
   }
}

//TODO read webclient.properties before defaulting to vmware.com
window.location =
      "http://vsphereclient.vmware.com/vsphereclient/" +
      createBuildUrl() +
      "VMware-ClientIntegrationPlugin-" +
      cipBuildVersion +
      "." +
      getExtension();
</script>
</head>
<body>
Redirecting download request...
</body>
</html>
