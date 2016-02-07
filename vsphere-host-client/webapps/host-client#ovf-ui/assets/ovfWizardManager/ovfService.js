/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/*
 * Common service to trigger 2rd party ovfTool commands
 * Dependency on xmlUtil service.
 * Can be injected into other controllers using dependency injection.
 */
myApp.factory('ovfHelper', function(xmlUtil, $q, $rootScope, $timeout) {
   ovfParserConsts = {
      result : "RESULT",
      warning : "Warning",
      progress : 'PROGRESS',
      error : "ERROR",
      verifySuccess : "VALIDATEHOST",
      prefix : "+",
      probe : "PROBE",
      powerOn : "POWERON",
      ipAddress : "IP_ADDRESS",
      vmRef : 'vim.VirtualMachine',
      openTag : '<data>',
      closeTag : '</data>',
      ovfName : "VMware vCenter Server Appliance",
      notColoudVMSource: "Not a VMware vCenter Server Appliance OVF source"
   };
   return {
      setOvfSource : function(pluginId, ticket, source) {
         var result = {};
         var deferredPromise = $q.defer();
         result.status = setOvfSource(pluginId, ticket, source,
               function(ticket, path) {
                  result.path = path;
                  $rootScope.$apply(function(){
                     deferredPromise.resolve(result);
                  });
         });
         vcsaLogger.info("Ovf Set source code >> " + result.status);
         if(result.status != 0) {
            result.message = "DeployVcsaSetupAppliancePage.errorInvalidOvf";
            deferredPromise.resolve(result);
         }
         return deferredPromise.promise;
      },

      probeOvfSource : function(pluginId, ticket, options) {
         var result = {};
         var deferredPromise = $q.defer();
         var ovfProbeData = ovfParserConsts.openTag;
         var timerFlag = false;
         result.status = ovfProbe(pluginId, ticket, options,
               function(ticket, probeMessage) {
                  timerFlag = true;
                  vcsaLogger.info("Ovf Probe message >> " + probeMessage );
                  $rootScope.$apply(function() {
                     // Ignore Constants
                     if (probeMessage.indexOf(ovfParserConsts.probe) != -1 ||
                           probeMessage.indexOf(ovfParserConsts.warning) != -1 ||
                           probeMessage.indexOf(ovfParserConsts.error) != -1){
                        return;
                     }
                     // Remove the "+" prefix and append to XML string
                     if (probeMessage.indexOf(ovfParserConsts.prefix) != -1) {
                        probeMessage = probeMessage.substring(2, probeMessage.length);
                        ovfProbeData = ovfProbeData + probeMessage;
                        return;
                     }
                     // On Result Convert XML to JSON
                     if(probeMessage.indexOf(ovfParserConsts.result) != -1){
                        ovfProbeData = ovfProbeData + ovfParserConsts.closeTag;
                        result.probeData = xmlUtil.xml2json(ovfProbeData);
                        if(!result.probeData.Errors) {
                           if (result.probeData.probeResult.productInfo.name !=
                                 ovfParserConsts.ovfName) {
                              result.message = ovfParserConsts.notColoudVMSource;
                              deferredPromise.resolve(result);
                              return;
                           }
                           deferredPromise.resolve(result);
                        } else {
                           result.message = result.probeData.Errors.Error.LocalizedMsg;
                           deferredPromise.resolve(result);
                        }
                     }
                  });
         });
         vcsaLogger.info("Ovf Probe status code >> " + result.status);
         //set timeout to check if ovfProbe function callback is invoked after 30 seconds.[timeout value can be changed]
         $timeout(function() {
           if(timerFlag == false) {
             result.message = "DeployVcsaSetupAppliancePage.errorOvfTimeout";
             deferredPromise.resolve(result);
           }
         },30000);
         if (result.status != 0) {
            result.message = "DeployVcsaSetupAppliancePage.errorInvalidOvf";
            deferredPromise.resolve(result);
         }
         return deferredPromise.promise;
      },

      verifyOvfSource : function(pluginId, ticket, options) {
         var result = {};
         var deferredPromise = $q.defer();
         var ovfVerifyData = ovfParserConsts.openTag;
         var marker = "";
         var timerFlag = false;
         result.status = ovfVerify(pluginId, ticket, options,
               function(ticket, verifyMessage) {
                  vcsaLogger.info("Ovf Verify message >> " + verifyMessage );
                  $rootScope.$apply(function() {
                     timerFlag = true;
                     if (verifyMessage.indexOf(ovfParserConsts.prefix) === -1) {
                        marker = verifyMessage;
                        return;
                     }
                     if (marker.indexOf(ovfParserConsts.progress) != -1) {
                        return;
                     }
                     // On Result Convert XML to JSON
                     if (marker.indexOf(ovfParserConsts.result) != -1) {
                        ovfVerifyData = ovfVerifyData + ovfParserConsts.closeTag;
                        result.ovfVerifyData = xmlUtil.xml2json(ovfVerifyData);
                        deferredPromise.resolve(result);
                     } else {
                        // Remove the "+" prefix and append to XML string
                        verifyMessage = verifyMessage.substring(2, verifyMessage.length);
                        ovfVerifyData = ovfVerifyData + verifyMessage;
                        return;
                     }
                  });
         });
         vcsaLogger.info("Ovf verify status code >> " + result.status);
         //set timeout to check if ovfProbe function callback is invoked after 30 seconds.[timeout value can be changed]
         $timeout(function() {
           if(timerFlag == false) {
             result.message = "DeployVcsaSetupAppliancePage.errorOvfTimeout";
             deferredPromise.resolve(result);
           }
         },30000);
         if (result.status != 0) {
            result.message = "DeployVcsaSetupAppliancePage.errorInvalidOvf";
            deferredPromise.resolve(result);
         }
         return deferredPromise.promise;
      },

      execute : function(pluginId, ticket, options, localeMap, progressCallback) {
         var result = {};
         result.complete = false;
         var powerOnProgressFlag = false;
         var previousMessage = "";
         var flagStopTimer = false;
         var executeXml = ovfParserConsts.openTag;
         //Timer functions
         var timeoutFunction = function() {
           var timer;
           return {
             startTimer : function() {
               timer = $timeout(function() {
                 result.errors = {};
                 result.errors.Error = {};
                 result.errors.Error.LocalizedMsg = localeMap["DeployVcsaSetupAppliancePage.errorOvfFailed"];
                 text:result.errors.Error.Type = "ovfTool.timeout";
                 vcsaLogger.info("Ovf Execute message >> " + result.errors.Error.LocalizedMsg );
                 progressCallback(result);
               },240000);
             },
             stopTimer : function() {
               $timeout.cancel(timer);
             }
           }
         };
         var executeTimeout = timeoutFunction();
         var status = ovfExecute(pluginId, ticket, options,
               function(ticket, message) {
                  vcsaLogger.info("Ovf Execute message >> " + message );
                  executeTimeout.stopTimer();
                  if (message.match(ovfParserConsts.result)) {
                     flagStopTimer = true;
                     // Update current step to power on.
                     try {
                       executeXml += ovfParserConsts.closeTag;
                       jsonData = xmlUtil.xml2json(executeXml);
                       result.warnings = jsonData.Warning;
                       result.errors = jsonData.Errors;
                       result.complete = true;
                       progressCallback(result);
                     } catch(e) {
                       result.errors = {};
                       result.errors.Error = {};
                       result.errors.Error.LocalizedMsg =
                           localeMap["DeployVcsaSetupAppliancePage.ovfParseError"];
                       text:result.errors.Error.Type = "ovfTool.parseError";
                       vcsaLogger.info("Ovf Execute message >> " + result.errors.Error.LocalizedMsg );
                       progressCallback(result);
                     }
                  } else if (previousMessage.match(ovfParserConsts.ipAddress)) {
                     result.ip = message.split(' ')[1];
                  } else if (message.charAt(0) === ovfParserConsts.prefix) {
                     // To get rid of the plus prefix in the message.
                     message = message.substring(2, message.length);
                     message = message.trim();
                     if (message.match(ovfParserConsts.vmRef)) {
                        result.vmRef = message + ":null";
                     }
                     else if (message.length <= 3) {
                        if(!powerOnProgressFlag) {
                           result.progress = message;
                           progressCallback(result);
                        }
                     } else {
                        // xml
                        executeXml += message;
                     }
                  } else if (message.match(ovfParserConsts.powerOn)) {
                     powerOnProgressFlag = true;
                  }
                  if (!flagStopTimer) {
                    executeTimeout.startTimer();
                  }
                  previousMessage = message;
         });
         vcsaLogger.info("Ovf Execute status code >> " + status);
         if (status != 0) {
            result.status = status;
            if (status == 12) {
               result.message = "DeployVcsaProgressPage.invalidOvfParameters";
            } else {
               result.message = "DeployVcsaProgressPage.ovfExecuteError";
            }
            progressCallback(result);
         }
         else {
           executeTimeout.startTimer();
         }
      },

      ssoValidate: function(pluginId, ssoIp, ssoPort, ssoUser, ssoPassword, ssoDomain) {
        var ssoFlag = 0;
        var ssoResult = {
           'ssoFlag' : 0,
           'domainName': '',
           'statusCode':''
        }
        var statusCode = '', domainName = '';
        var deferredPromise = $q.defer();
        if(document.getElementById(pluginId).sso) {
           ssoFlag = 1;
           document.getElementById(pluginId).sso.validateSSO(ssoIp, ssoPort, ssoUser, ssoPassword,
             function(status,domain){
               ssoResult['ssoFlag'] = ssoFlag;
               ssoResult['domainName'] = domain;
               ssoResult['statusCode'] = status;
               $rootScope.$apply(function(){
                  deferredPromise.resolve(ssoResult);
               });
            })
         }
         else {
            //MAC
            ssoFlag = 0;
            deferredPromise.resolve(ssoResult);
         }
         return deferredPromise.promise;
      },

      ssoCheckMAC: function(pluginId) {
         if(document.getElementById(pluginId).sso) {
            return false;
         }
         else {
            return true;
         }

      }
   }
});
