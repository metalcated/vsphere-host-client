/* Copyright 2014 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * Connect to SSO controller. To handle connection to SSO (nfra/embedded node)
 * while deploying a management node.
 */
angular.module('myApp').controller('ConnectToSsoController', ['$scope', 'blocker', 'ovfHelper', '$timeout',
      function($scope, blocker, ovfHelper, $timeout) {
   var wizard = $scope.vxWizard;
   $scope.submitted = false;
   var ssoIp,ssoPort = 443, ssoUser, ssoPassword,ssoDomain;
   var pluginId = wizard.wizardData.ovfVar.pluginId;
   var macCheckFlag = false;
   // Checks if error class has to be applied to control-group based on
   // form state.
   $scope.addErrorClass = function(elem) {
      return elem.$invalid && ($scope.submitted || !elem.$error.required);
   }
   $scope.showRequiredError = function(elem) {
      return elem.$error.required && $scope.submitted;
   }
   $scope.showDomainNameError = function(elem) {
      return !elem.$error.required && elem.$error.domainFormat;
   }

   $scope.checkForMAC = function() {
       return ovfHelper.ssoCheckMAC(pluginId);
   }
   angular.extend(wizard.current, {
      onNext: function() {
         $scope.submitted = true;
         wizard.validationBanner.data = [];
         if($scope.connectSSODataForm.$invalid) {
            return false;
         }
         else {
            if(macCheckFlag) {
               return true;
            }
            else {
               blocker.blockUI();
               return $timeout(function(){
                  ssoIp = wizard.wizardData.ovfOptions.ssoNodeData.ssoInstanceIp;
                  ssoUser = wizard.localeMap['DeployVcsaConfigureSSOPage.administrator'];
                  ssoPassword = wizard.wizardData.ovfOptions.ssoNodeData.ssoPassword;
                  return ssoCheck(pluginId, ssoIp, ssoPort, ssoUser, ssoPassword,
                           ssoDomain).then(function(ssoResult) {
                     blocker.unBlockUI();
                     var ssoFlag = ssoResult['ssoFlag'];
                     var domain = ssoResult['domainName'];
                     var result = ssoResult['statusCode'];
                     if(ssoFlag == 0) {
                        return true;
                     }
                     else {
                        if(result == "OK") {
                           wizard.wizardData.ovfOptions.ssoNodeData.ssoDomainName
                                 = domain;
                           return true;
                        }
                        else {
                           wizard.validationBanner.data = [{text: wizard.localeMap[
                                 "DeployVcsaConfigureSSOPage.invalidSSODetails"],
                                 type:"critical"}];
                           return false;
                        }
                     }
                  });
               },1000);
            }
         }
      }

   });
   ssoCheck = function(pluginId, ssoIp, ssoPort, ssoUser, ssoPassword, ssoDomain){
      return ovfHelper.ssoValidate(pluginId, ssoIp, ssoPort, ssoUser, ssoPassword,
            ssoDomain);
   }

}]);
