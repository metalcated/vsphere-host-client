/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * Datastores controller.
 */
angular.module('myApp').controller('DatastoresController',
      ['$scope', '$q', 'blocker', 'ovfHelper', '$http',
      function($scope, $q, blocker, ovfHelper, $http){

   var wizard = $scope.vxWizard;

   var fifteenGB = 16106127360;

   var gbTemplate =  '<div class="ngCellText" ng-class="col.colIndex()">'+
         '<span ng-cell-text>{{toGb(row.getProperty(col.field))}} GB</span></div>';
   var noDataStores = false;
   $scope.toGb = function(spaceInBytes) {
     var spaceInGb = spaceInBytes / 1073741824;
     return Math.round(spaceInGb * 100) / 100;
   };

   $scope.mySelections = [];
   $scope.myData = [];
   $scope.gridOptions = {
      data: 'myData',
      selectedItems: $scope.mySelections,
      columnDefs: [
         {field : 'name', displayName :
               wizard.localeMap['DeployVcsaStoragePage.Name']},
         {field : 'type', displayName :
               wizard.localeMap['DeployVcsaStoragePage.type']},
         {field : 'capacity', displayName :
               wizard.localeMap['DeployVcsaStoragePage.capacity'],
               cellTemplate : gbTemplate},
         {field : 'freeSpace', displayName :
               wizard.localeMap['DeployVcsaStoragePage.free'],
               cellTemplate : gbTemplate},
         {field : 'provisioned', displayName :
               wizard.localeMap['DeployVcsaStoragePage.provisioned'],
               cellTemplate : gbTemplate},
         {field :'thinProvision', displayName :
               wizard.localeMap['DeployVcsaStoragePage.thinProvisioning'],
               width: '110px'}],
      multiSelect: false
   };

   url = "messagebroker/getDatastores/urn:vmomi:EnvironmentBrowser:" +
         wizard.wizardData.ebValue +
         ":" + wizard.wizardData.ebServerGuid;
   $http.get(url).success(
         function(result){
            if (result.length === 0) {
               noDataStores = true;
               return;
            }
            $scope.myData = result;
            $scope.mySelections[0] = $scope.myData[0];
         });

   angular.extend(wizard.current,{
      onNext: function() {
         if (noDataStores) {
            wizard.validationBanner.data = [{text: wizard.localeMap[
                  "DeployVcsaStoragePage.errorNoDatastoresOnHost"],
                  type:"critical"}];
            return false;
         }
         blocker.blockUI();
         // Validate selected datastore.
         if (!validateSelectedDisk()) {
            blocker.unBlockUI();
            return;
         }
         wizard.wizardData.ovfOptions.datastoreData.moRef =
               $scope.mySelections[0].moRef;
         wizard.wizardData.ovfOptions.datastoreData.name =
               $scope.mySelections[0].name;

         return ovfVerifyAsyncFn().then(function(result) {
            if (result.ovfVerifyData.Errors) {
               errorMessages = [];
               for (i in result.ovfVerifyData.Errors.Error) {
                  errorMessages.push({text:result.ovfVerifyData.Errors.Error[i].LocalizedMsg, type:"critical"});
               }
               wizard.validationBanner.data = errorMessages;
               blocker.unBlockUI();
               return false;
            } else {
               blocker.unBlockUI();
               return true;
            }
         });
      }
   });

   // Function to validate the selected datastore against requirements
   // of the cloudVM ovf.
   function validateSelectedDisk(){
      // Disk free space check based on thin/thick
      if (wizard.wizardData.ovfOptions.datastoreData.diskMode === "thin"){
         // Check if thin provision is avaiable if selected
         if (!$scope.mySelections[0].thinProvision) {
            wizard.validationBanner.data =
               [{text: wizard.localeMap[
               "DeployVcsaStoragePage.errorThinProvisioningNotSupported"],
               type:"critical"}];
            return false;
         }
         if ($scope.mySelections[0].freeSpace <
                  fifteenGB) {
             wizard.validationBanner.data = [{text: wizard.localeMap[
                  "DeployVcsaStoragePage.errorProvisioningNotPossible"],
                  type:"critical"}];
            return false;
         }
      } else {
         // In case of thick provision size checked against flat size.
         if ($scope.mySelections[0].freeSpace <
               wizard.wizardData.probeData.probeResult.sizes.flat) {
            wizard.validationBanner.data = [{text: wizard.localeMap[
                  "DeployVcsaStoragePage.errorProvisioningNotPossible"],
                  type:"critical"}];
         return false;
         }
      }
      return true;
   }

   /**
    * Calls ovf verify to validate the target and source
    * for a given OVF session ticket.
    *
    * @return
    *    A Promise that is returned by ovfHelper. which
    *    when resolved gives a result with message, path and status.
    */
   ovfVerifyAsyncFn = function() {
      var deferredPromise = $q.defer();
      var options = ["--deploymentOption=" +
            wizard.wizardData.ovfOptions.sizingData.id];
      options.push("--acceptAllEulas");
      // fetch ticket and SSLthumbprint.
      $http.get("messagebroker/hostdata/properties/" +
            wizard.wizardData.ovfVar.objectId +
            "?properties=viSessionTicket,sslThumbprintForOvfTool").success(
         function(result) {
            options.push("--I:targetSessionTicket=" + result.viSessionTicket);
            options.push("--targetSSLThumbprint=" +
                  result.sslThumbprintForOvfTool);
            options.push("--I:morefArgs");
            options.push("--datastore=" +
                  wizard.moreftoString(wizard.wizardData.ovfOptions.datastoreData.moRef));
            ovfHelper.verifyOvfSource(wizard.wizardData.ovfVar.pluginId,
               wizard.wizardData.ovfVar.ticket, options).then(function(result){
                  deferredPromise.resolve(result);
               });
        });
      return deferredPromise.promise;
   }
}]);
