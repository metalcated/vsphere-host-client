/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * Networks controller.
 */
angular.module('myApp').controller('NetworksController',
      ['$scope','$http', function($scope, $http) {
   var wizard = $scope.vxWizard;
   var noNetworks = false;
   $scope.dnsServerNames = '';
   $scope.ipFamily = wizard.wizardData.ovfOptions.networkData.netAddrFamily;
   $scope.modesData =
         wizard.wizardData.ovfOptions.networkData.netAddrFamily === "ipv6" ?
         wizard.wizardData.ipv6Modes : wizard.wizardData.ipv4Modes;
   $scope.mySelections = [];
   $scope.mySelections[0] = null;
   $scope.submitted = false;
   $scope.portData = {};
   $scope.internalPorts = wizard.wizardData.ovfOptions.internalPorts;

   //Set portData
   if(wizard.wizardData.ovfOptions.nodeType == 'embedded') {
      $scope.portData =
            wizard.wizardData.ovfOptions.externalPorts["embedded"];
      wizard.wizardData.ovfOptions.portData =
         $scope.portData;
   }else if(wizard.wizardData.ovfOptions.nodeType == 'management') {
      $scope.portData =
            wizard.wizardData.ovfOptions.externalPorts["management"];
      wizard.wizardData.ovfOptions.portData =
         $scope.portData;
   } else {
      if(wizard.wizardData.ovfOptions.nodeType == 'infrastructure') {
         $scope.portData =
               wizard.wizardData.ovfOptions.externalPorts["infrastructure"];
         wizard.wizardData.ovfOptions.portData =
            $scope.portData;
      }
   }
   // Autoconf hidden based on net family choosen.
   $scope.setNetModes = function() {
      $scope.ipFamily = wizard.wizardData.ovfOptions.networkData.netAddrFamily;
      $scope.modesData =
            wizard.wizardData.ovfOptions.networkData.netAddrFamily === "ipv6" ?
            wizard.wizardData.ipv6Modes : wizard.wizardData.ipv4Modes;
      wizard.wizardData.ovfOptions.networkData.netMode = "dhcp";
   }
   // check if netMode is nonstatic to enable/disable form.
   $scope.isNotStatic = function() {
      return wizard.wizardData.ovfOptions.networkData.netMode === "static" ? false : true;
   }
   // check if time sync option is NTP
   $scope.isTypeTools = function() {
      return wizard.wizardData.ovfOptions.networkData.timeSyncType === "tools" ? true : false;
   }
   $scope.getNTPClass = function() {
      return {disabled: $scope.isTypeTools()};
   }
   //validators
   $scope.addErrorClass = function(elem) {
      return !$scope.isNotStatic() && elem.$invalid &&
            ($scope.submitted || !elem.$error.required);
   }
   $scope.addErrorClassForServicePorts = function(elem) {
      return elem.$invalid;
   }
   $scope.addErrorClassForHost = function(elem) {
      return elem.$error.required && $scope.submitted;
   }
   $scope.getControlGroupClass = function(elm){
      return {error :$scope.addErrorClass(elm), disabled: $scope.isNotStatic()};
   }
   $scope.getHostControlGroupClass = function(elm){
      return {error :$scope.addErrorClassForHost(elm)};
   }
   $scope.showRequiredError = function(elem) {
      return !$scope.isNotStatic() && elem.$error.required && $scope.submitted;
   }
   $scope.showRequiredHostError = function(elem) {
      return elem.$error.required && $scope.submitted;
   }
   $scope.showInvalidIpError = function(elem) {
      return !$scope.isNotStatic() && !elem.$error.required && elem.$error.isIp;
   }
   $scope.showInvalidPortError = function(elem) {
      return elem.$error.portNumberValid;
   }
   $scope.showUnavailablePortError = function(elem) {
      return !elem.$error.portNumberValid && elem.$error.portAvailable;
   }

   //check if net mode is autoconf
   $scope.notAutoConf = function() {
      if(wizard.wizardData.ovfOptions.networkData.netMode === "autoconf") {
         return true;
      } else {
         return false;
      }
   }

   $scope.networksList = [];
   // Call to fetch Networks  of the target.
   url = "messagebroker/hostdata/properties/urn:vmomi:EnvironmentBrowser:" +
            wizard.wizardData.ebValue + ":" + wizard.wizardData.ebServerGuid +
            "?properties=assignableNetworks";
   $http.get(url).success(
         function(result){
            if (result.assignableNetworks.length === 0) {
               noNetworks = true;
               return;
            }
            $scope.networksList = result.assignableNetworks;
            $scope.mySelections[0] = result.assignableNetworks[0];
         });

   $scope.currentView = "networkSettings";
   $scope.switchToNetworkSettings =  function() {
      $scope.currentView = "networkSettings";
   }

   $scope.switchToServicePorts =  function() {
      $scope.currentView = "servicePorts";
   }

   angular.extend(wizard.current,{
      onNext: function() {
         wizard.validationBanner.data = [];
         $scope.submitted = true;
         if (noNetworks) {
            wizard.validationBanner.data =
                  [{text: wizard.localeMap["DeployVcsaNetworkPage.errorNoNetworks"],
                  type:"critical"}];
            return false;
         }
         // To check for empty NTP Server field.
         if (!$scope.isTypeTools() && $scope.networkDataForm.netNTPServers.$invalid) {
            wizard.validationBanner.data =
                  [{text: wizard.localeMap["DeployVcsaNetworkPage.errorNoNTPServers"],
                  type:"critical"}];
            return false;
         }
         // If network mode is static check for required fields to be not empty
         if (!$scope.isNotStatic() && $scope.networkDataForm.$invalid) {
            return false;
         }
         if ($scope.portDataForm.$invalid) {
            wizard.validationBanner.data =
               [{text: wizard.localeMap["DeployVcsaNetworkPage.errorPortsInvalid"],
               type:"critical"}];
            return false;
         }
         wizard.wizardData.ovfOptions.networkData.nwMoRef =
               $scope.mySelections[0].value;
         wizard.wizardData.ovfOptions.networkData.name =
               $scope.mySelections[0].name;
         return true;
      }
   });
}]);
