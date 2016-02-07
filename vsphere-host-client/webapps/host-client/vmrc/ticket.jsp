<%@ page language="java" contentType="application/json; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.lang.Exception" %>
<%@ page import="com.vmware.vise.util.security.NonceUtil" %>
<%@ page import="com.vmware.vise.vim.commons.VimSessionUtil" %>
<%@ page import="com.vmware.vise.vim.commons.vcservice.LinkedVcGroup" %>
<%@ page import="com.vmware.vise.vim.commons.vcservice.VcService" %>
<%@ page import="com.vmware.vim.binding.vmodl.ManagedObjectReference" %>
<%@ page import="com.vmware.vim.binding.vim.SessionManager" %>
<%@ page import="com.vmware.vise.vim.commons.extensions.LinkedVcGroupRegistry" %>

<%
String ticket = "";
String errorMsg = "";
String nonce = "";
String serverGuid = "";

try {
   // Check if Nonce is accepted
   nonce = request.getParameter("nonce");
   serverGuid = request.getParameter("serverGuid");
   NonceUtil.consumeNonce(request.getSession(false), nonce);

   // Request a ticket
   LinkedVcGroupRegistry registry = VimSessionUtil.getLinkedVcGroupRegistry(session);
   LinkedVcGroup group = registry.getLinkedGroupByServiceUuid(serverGuid);
   VcService startupVc = group.getVcService(serverGuid);

   ManagedObjectReference sessMgrRef = startupVc.getServiceInstanceContent().sessionManager;
   SessionManager sessMgr = (SessionManager) group.getManagedObject(sessMgrRef);
   ticket = sessMgr.acquireCloneTicket();
} catch (Exception ex) {
   errorMsg = ex.getMessage();
}
%>
{ "ticket": "<%= ticket %>",
  "error":  "<%= errorMsg %>" }