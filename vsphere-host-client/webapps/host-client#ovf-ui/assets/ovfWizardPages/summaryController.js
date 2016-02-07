/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * SummaryController collects the option and passses triggers execute.
 */
angular.module('myApp').controller('SummaryController',
      ['$scope','$http',function($scope, $http) {
   var wizard = $scope.vxWizard;
   var ovfOptions = wizard.wizardData.ovfOptions;
   var localeMap = wizard.localeMap;
   toGb = function(spaceInBytes) {
     var spaceInGb = spaceInBytes / 1073741824;
     return Math.round(spaceInGb * 100) / 100;
   };
   var EQUALS = " = ";
   $scope.summary = [
         {name: localeMap["DeployVcsaSummaryPage.ovfFile"],
               value: wizard.wizardData.localFileSourceSet ?
               wizard.wizardData.ovfSourceLocalPath :
               wizard.wizardData.ovfSource },
         {name: localeMap["DeployVcsaSummaryPage.downloadSize"], value:
               toGb(wizard.wizardData.probeData.probeResult.sizes.download) + " GB"},
         {name: localeMap['DeployVcsaSummaryPage.name'], value: ovfOptions.vmName },
         {name: localeMap["DeployVcsaSummaryPage.installType"],
               value: wizard.wizardData.migrationFlag ?
               localeMap["DeployVcsaSummaryPage.migrate"] :
               localeMap["DeployVcsaSummaryPage.install"]},
         {name: localeMap["DeployVcsaSummaryPage.nodeType"],
               value: ovfOptions.nodeType},
         {name: localeMap["DeployVcsaSummaryPage.deploymentConfiguration"],
               value: ovfOptions.sizingData.label},
         {name: localeMap["DeployVcsaSummaryPage.datastore"],
               value: ovfOptions.datastoreData.name},
         {name : localeMap['DeployVcsaSummaryPage.diskMode'],
               value: ovfOptions.datastoreData.diskMode},
         {name: localeMap['DeployVcsaSummaryPage.networkMapping'], value:
               wizard.wizardData.probeData.probeResult.networks.network.name
               + " to " + ovfOptions.networkData.name },
         {name:localeMap['DeployVcsaSummaryPage.ipAllocation'],
               value: ovfOptions.networkData.netAddrFamily + " , " +
               ovfOptions.networkData.netMode}];
   if (ovfOptions.networkData.netMode != "autoconf" &&
         ovfOptions.networkData.hostName != "") {
      $scope.summary.push(
         {  name:localeMap['DeployVcsaNetworkPage.hostName'],
            value: ovfOptions.networkData.hostName
         }
      );
   }
   $scope.properties = [
      localeMap["DeployVcsaSummaryPage.sshEnabled"] + EQUALS + ovfOptions.sshEnabled
   ];
   // Management node deployment
   if(ovfOptions.nodeType === "management") {
      $scope.properties.push(
            localeMap["DeployVcsaSummaryPage.ssoInstanceIp"] + EQUALS + ovfOptions.ssoNodeData.ssoInstanceIp,
            localeMap["DeployVcsaSummaryPage.domainName"] + EQUALS + ovfOptions.ssoNodeData.ssoDomainName);
   } else{
      if (wizard.wizardData.ssoType === 'replicate') {
         $scope.properties.push(
               localeMap["DeployVcsaSummaryPage.ssoInstanceIp"] + EQUALS + ovfOptions.ssoPartnerData.ssoInstanceIp,
               localeMap["DeployVcsaSummaryPage.domainName"] + EQUALS + ovfOptions.ssoPartnerData.ssoDomainName,
               localeMap["DeployVcsaSummaryPage.siteName"] + EQUALS + ovfOptions.ssoPartnerData.ssoSiteName);
      } else {
         $scope.properties.push(
               localeMap["DeployVcsaSummaryPage.domainName"] + EQUALS + ovfOptions.passwordData.ssoDomainName,
               localeMap["DeployVcsaSummaryPage.siteName"] + EQUALS + ovfOptions.passwordData.ssoSiteName);
      }
   }
   // Database parameters. No options are set during migration or
   // during infrastructure node installtion.
   if (!wizard.wizardData.migrationFlag &&
         ovfOptions.nodeType !== "infrastructure") {
      $scope.summary.push({name: localeMap['DeployVcsaSummaryPage.database'],
                value: ovfOptions.databaseData.dbType});
      // If external db option is selected.
      if(ovfOptions.databaseData.dbType === 'external') {
         $scope.properties.push(localeMap["DeployVcsaSummaryPage.dbProviderOracle"]);
         $scope.properties.push(localeMap["DeployVcsaSummaryPage.dbServerName"] +
               EQUALS + ovfOptions.databaseData.dbServerName);
         $scope.properties.push(localeMap["DeployVcsaSummaryPage.dbServerPort"] +
               EQUALS + ovfOptions.databaseData.dbServerPort);
         $scope.properties.push(localeMap["DeployVcsaSummaryPage.dbInstance"] +
               EQUALS + ovfOptions.databaseData.dbInstance);
         $scope.properties.push(localeMap["DeployVcsaSummaryPage.dbUser"] +
               EQUALS + ovfOptions.databaseData.dbUsername);
      }
   }
   if (ovfOptions.networkData.netMode === "static") {
      $scope.properties.push(localeMap["DeployVcsaSummaryPage.network1IPAddress"] +
            EQUALS + ovfOptions.networkData.netAddr);
      $scope.properties.push(localeMap["DeployVcsaSummaryPage.network1Netmask"] +
            EQUALS + ovfOptions.networkData.netPrefix);
      $scope.properties.push(localeMap["DeployVcsaSummaryPage.defaultGateway"] +
            EQUALS + ovfOptions.networkData.netGateway);
      $scope.properties.push(localeMap["DeployVcsaSummaryPage.dns"] +
            EQUALS + ovfOptions.networkData.dnsServerNames);
   }

}]);
