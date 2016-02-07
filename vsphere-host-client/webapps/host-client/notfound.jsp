<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<%@ page import="com.vmware.vise.extensionfw.DeploymentUtil" %>
<%@ page import="com.vmware.vsphere.client.error.ErrorConstants" %>
<%@ page import="org.apache.commons.lang.StringEscapeUtils" %>
<%
/**
 * Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential
 */

boolean isStarted = DeploymentUtil.allPackagesDeployed();

String requestedUri = (String)(request.getAttribute("javax.servlet.error.request_uri"));
requestedUri = StringEscapeUtils.escapeHtml(requestedUri);

String headerMessage = isStarted ?
      ErrorConstants.text("ErrorPage.pageNotFound") :
      ErrorConstants.text("ErrorPage.serverInitializing.header");
headerMessage = StringEscapeUtils.escapeHtml(headerMessage);

String details = isStarted ?
      ErrorConstants.text("ErrorPage.contactAdmin") :
      ErrorConstants.text("ErrorPage.serverInitializing.message");
details = StringEscapeUtils.escapeHtml(details);
%>

<html>
<head>
   <title><%=StringEscapeUtils.escapeHtml(ErrorConstants.text("ErrorPage.notFoundTitle"))%></title>
   <style><!--
   body {
      font-family: Arial, Helvetica, sans-serif;
      background-color: white;
      font-size: 14px;
      line-height: 200%;
      color: black;
   }

   #errorDiv {
      margin-left: 10px;
      margin-rigth: 10px;
      margin-top: 40px;
   }

   h1 {
      font-weight: bold;
      font-size: 24px;
   }

   h2 {
      font-weight: bold;
      font-size: 16px;
      margin-left: 60px;
   }

   a {
      font-size: 12px;
      color: #336699;
   }
   --></style>
   <meta http-equiv="refresh" content="60">
</head>
<body>
   <div id="errorDiv">
      <h1><%=headerMessage%></h1>
      <hr size="1" noshade="noshade">
      <% if (isStarted) { %>
         <p><%=StringEscapeUtils.escapeHtml(ErrorConstants.text("ErrorPage.cantFindPage"))%></p>
         <h2><%=requestedUri%></h2>
      <% } %>
      <p><%=details%></p>
      <p>
         <% if (isStarted) { %>
            <a href="/vsphere-client"><%=StringEscapeUtils.escapeHtml(ErrorConstants.text("ErrorPage.vSphereHome"))%></a> |
         <% } %>
         <a href="https://www.vmware.com/support/product-support/vsphere/index.html"><%=StringEscapeUtils.escapeHtml(ErrorConstants.text("ErrorPage.vSphereDocs"))%></a>
      </p>
   </div>
</body>
</html>
