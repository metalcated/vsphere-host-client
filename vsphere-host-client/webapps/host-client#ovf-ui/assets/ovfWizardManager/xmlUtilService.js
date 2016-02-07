/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/*
 * Common service to parse XMLtoJSON
 * Can be injected into other controllers using dependency injection.
 */
myApp.factory('xmlUtil', function() {
   return {
      xml2json : function(xmlString) {
         return $.xml2json(xmlString);
      }
   }
});