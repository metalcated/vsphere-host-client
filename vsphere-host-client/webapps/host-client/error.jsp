<%@ page contentType="text/html;charset=utf-8" isErrorPage="true" %>
<%@ page import="org.apache.commons.lang.StringEscapeUtils" %>
<%
      String errorMessage = "An internal system error occurred.";
      if (exception != null && exception.getMessage() != null) {
         errorMessage = StringEscapeUtils.escapeHtml(exception.getMessage());
      }
%>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- saved from url=(0014)about:internet -->
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <style type="text/css" media="screen">
         html, body {
            height: 100%;
            overflow: auto;
            margin: 0;
            padding: 0;
            font: 13px Arial, 'Helvetica Neue', sans-serif;
            color: #cc0000;
         }
         p {
            margin: 20px;
            padding: 0;
         }
         img {
            border: 0;
         }
      </style>
   </head>
   <body>
      <p><img src="./assets/error.png" alt="Error" /> <%= errorMessage %></p>
   </body>
</html>
