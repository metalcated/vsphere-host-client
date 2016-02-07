<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<%@ page import="com.vmware.vsphere.client.error.ErrorConstants" %>
<%
/**
 * Copyright 2011 VMware, Inc.  All rights reserved. -- VMware Confidential
 */
%>
<html>
<head>
<link rel="stylesheet" href="assets/askvmwaremain.css" type="text/css" />
<link rel="stylesheet" href="assets/askvmwareprint.css" media="print" type="text/css" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title><%=ErrorConstants.text("ErrorJsp.header.label")%></title>
</head>
<body>
   <table id="header" width="100%" cellpadding="0" cellspacing="0" border="0" height="27"
         style="position:absolute;width:100%;font-size: 14px;padding: 0px 16px 0px 16px">
      <tr>
         <td width="100%" valign="middle" class="headerText"><%=ErrorConstants.text("ErrorJsp.header.label")%></td>
         <td nowrap valign="middle"><img src="assets/vmw_logo_trsp.png" width="76" height="12" alt="VMware"/></td>
      </tr>
   </table>
   <img src="assets/header_tile.png" width="100%" height="27" alt=""/>
   <div class="contentRegion">
	   <br/>
	   <p>
	   <%=request.getAttribute("errorMessage")%>
	   <!-- Error Details:
	   <%-- This is a dump of the unexpected error for debugging / QA purpose --%>
<%= request.getAttribute("errorDetails")%>
	   -->
	   </p>
	   <p><%=ErrorConstants.text("ErrorJsp.vsphereLogin")%></p>
   </div>
</body>
</html>