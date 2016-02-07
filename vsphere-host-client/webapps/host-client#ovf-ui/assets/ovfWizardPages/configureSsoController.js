/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * SSO controller. To handle replication form partner host or
 * creating a new one.
 */
angular.module('myApp').controller('ConfigureSsoController', ['$scope','blocker', 'ovfHelper', '$timeout',
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
   $scope.showPasswordError = function(elem) {
      return !elem.$error.required && elem.$error.passwordComplexity;
   }
   $scope.showPasswordMatchError = function(elem) {
      return !elem.$error.required && elem.$error.passwordMatch;
   }
   $scope.showDomainNameError = function(elem) {
      return !elem.$error.required && elem.$error.domainFormat;
   }
   $scope.showSsoSiteNameMatchError = function(elem) {
      return !elem.$error.required && elem.$error.siteFormat;
   }

   $scope.checkForMAC = function() {
      return ovfHelper.ssoCheckMAC(pluginId);
   }
   angular.extend(wizard.current, {

      onNext: function() {

         if (wizard.wizardData.ssoType === '') {
            wizard.validationBanner.data = [{text: wizard.localeMap[
                  "DeployVcsaConfigureSSOPage.selectAnOptionToProceed"],
                  type:"critical"}];
            return false;
         }
         $scope.submitted = true;
         wizard.validationBanner.data = [];
         if (wizard.wizardData.ssoType === 'create' &&
               $scope.createSsoDataForm.$invalid) {
            return false;
         } else if (wizard.wizardData.ssoType === 'replicate') {
            if ($scope.replicateSsoDataForm.$invalid) {
               return false;
            }
            else {
               if(macCheckFlag) {
                  return true;
               }
               else {
                  blocker.blockUI();
                  return $timeout(function(){
                     ssoIp = wizard.wizardData.ovfOptions.ssoPartnerData.ssoInstanceIp;
                     ssoUser = wizard.localeMap['DeployVcsaConfigureSSOPage.administrator'];
                     ssoPassword = wizard.wizardData.ovfOptions.ssoPartnerData.ssoPassword;
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
                              wizard.wizardData.ovfOptions.ssoPartnerData.ssoDomainName
                                    = domain;
                              return true;
                           }
                           else {
                              wizard.validationBanner.data =
                                    [{text: wizard.localeMap[
                                    "DeployVcsaConfigureSSOPage.invalidSSODetails"],
                                    type:"critical"}];
                              return false;
                           }
                        }

                     });
                  },1000);
               }
            }
         }else {
            return true;
         }
      }

   });

   ssoCheck = function(pluginId, ssoIp, ssoPort, ssoUser, ssoPassword, ssoDomain){
      return ovfHelper.ssoValidate(pluginId, ssoIp, ssoPort, ssoUser, ssoPassword,
            ssoDomain);
   }



}]);
