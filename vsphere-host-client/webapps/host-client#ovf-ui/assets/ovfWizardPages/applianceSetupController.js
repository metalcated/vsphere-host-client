/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * SourceController validates the source and probes it.
 * TODO mthirunavukkar - check if ovf is cloudVM ovf parse
 * output to gather more info.
 */
angular.module('myApp').controller('ApplianceSetupController',
      ['$scope', '$q', 'blocker', 'ovfHelper',
      function($scope, $q, blocker, ovfHelper){

   var wizard = $scope.vxWizard;
   $scope.existingVMNames = wizard.wizardData.vmNames;
   $scope.submitted = false;
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
   $scope.showVMNameError = function(elem) {
      return elem.$error.inArray && $scope.submitted;
   }

   // To trigger the file select on click of browse button
   // and set the source.
   $scope.chooseLocalFile =  function() {
      wizard.wizardData.ovfSourceLocalPath = "";
      wizard.wizardData.localFileSourceSet = true;
      wizard.validationBanner.data = [];
      ovfHelper.setOvfSource(wizard.wizardData.ovfVar.pluginId,
            wizard.wizardData.ovfVar.ticket,
            "FILE").then(function(result){
         if (result.message) {
            wizard.validationBanner.data = [{text:result.message,
                  type:"critical"}];
         } else {
            // Handle if user had not selected the file and clicks cancel
            if (wizard.wizardData.ovfSource === result.path) {
               return;
            }
            wizard.wizardData.ovfSourceLocalPath = result.path;
         }
      });
   }

   angular.extend(wizard.current, {
      onNext: function(){
         wizard.validationBanner.data = [];
         $scope.submitted = true;
         // Check for empty ovf source file path/url
          if (wizard.wizardData.localFileSourceSet) {
            if (wizard.wizardData.ovfSourceLocalPath === ""){
               wizard.validationBanner.data =
                     [{text: wizard.localeMap[
                     "DeployVcsaSetupAppliancePage.errorNoSourceFile"],
                     type:"critical"}];
               return false;
            }
         } else {
            // source is a url
            if (wizard.wizardData.ovfSource === "") {
               wizard.validationBanner.data =
                     [{text: wizard.localeMap[
                     "DeployVcsaSetupAppliancePage.errorNoSourceUrl"],
                     type:"critical"}];
               blocker.unBlockUI();
               return false;
            }
         }
         // Set virtual machine form validation
         if ($scope.setApplianceDataForm.$invalid) {
            return false;
         }
         blocker.blockUI();
         // Check if local File source was selected and call probe only.
         // Else Call setsource and probe.
         if (wizard.wizardData.localFileSourceSet) {
               return probeFunctionHandler();
         } else {
            // source is a url and so call setsource, probe async fns.
            wizard.wizardData.localFileSourceSet = false;
            wizard.wizardData.ovfSourceLocalPath = "";
            return setSourceAsyncFn().then(function(result){
               if (result.message) {
                  wizard.validationBanner.data =
                        [{text:wizard.localeMap[result.message],
                        type:"critical"}];
                  blocker.unBlockUI();
                  return false;
               } else {
                  return probeFunctionHandler();
               }
            });
         }
      }
   });

   probeFunctionHandler = function(){
      return probeAsyncFn().then(function(result){
         if (result.message) {
            wizard.validationBanner.data =
               [{text:result.message,
               type:"critical"}];blocker.unBlockUI();
               blocker.unBlockUI();
               return false;
         } else {
           //check whether the ovf url given is of version 6.0.0.0
           if(result.probeData.probeResult.productInfo.version == "6.0.0.0") {
             wizard.wizardData.probeData = result.probeData;
             blocker.unBlockUI();
             return true;
           } else {
             wizard.validationBanner.data =
                [{text:wizard.localeMap["DeployVcsaSetupAppliancePage.errorInvalidOvfVersion"],
                type:"critical"}];
                blocker.unBlockUI();
                return false;
           }
         }
      });
   }

   /**
    * Request the source locator to be set for a given OVF session ticket.
    *
    *    Source locator. This is either a locator of one of the types
    *    http://, https://, ftp://, vi://, vcloud://
    *    or the constant "FILE".
    *
    *    "FILE" will cause the plugin to open a file browser dialog so
    *     the user can select a local file to upload.
    *
    * @return
    *    A Promise that is returned by ovfHelper.setOvfSource which
    *    when resolved gives a result with message, path and status.
    */
   setSourceAsyncFn = function(){
      return ovfHelper.setOvfSource(wizard.wizardData.ovfVar.pluginId,
            wizard.wizardData.ovfVar.ticket,
            wizard.wizardData.ovfSource);
   }

   /**
    * Probe the ovf source after setting it.
    *
    * @return
    *    A Promise that is returned by ovfHelper.probeOvfSource which
    *    when resolved gives a result with message, probeData and status.
    */
   probeAsyncFn = function(){
      var options = [];
      return ovfHelper.probeOvfSource(wizard.wizardData.ovfVar.pluginId,
            wizard.wizardData.ovfVar.ticket, options);
   }

}]);
