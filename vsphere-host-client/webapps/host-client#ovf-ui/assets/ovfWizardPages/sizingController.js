/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * Sizing controller.
 */
angular.module('myApp').controller('SizingController',
      ['$scope', '$q', 'blocker', 'ovfHelper', '$http',
      function($scope, $q, blocker, ovfHelper, $http){
   var wizard = $scope.vxWizard;
   $scope.profileFlag = true;
   $scope.profileScopeFlag = true;

   // Node type
   var nodeType = wizard.wizardData.ovfOptions.nodeType,
       profileLayout = wizard.wizardData.profileLayout,
       filteredProfiles = [];

   if (wizard.wizardData.migrationFlag) {
      var cpuCount =
               wizard.wizardData.preupgradeCheckData.sourceInfo.inventoryInfo.cpu,
          memoryCount =
               wizard.wizardData.preupgradeCheckData.sourceInfo.inventoryInfo.memory,
          vmCount =
               wizard.wizardData.preupgradeCheckData.sourceInfo.inventoryInfo.vmCount,
          hostCount =
               wizard.wizardData.preupgradeCheckData.sourceInfo.inventoryInfo.hostCount,
          requiredDiskList =
               wizard.wizardData.preupgradeCheckData.requirements.requiredDstDiskSpace;
      if(wizard.wizardData.ovfOptions.migrationData.optionalBitsFlag) {
         vcsaLogger.info("SizingController - Optional Bit flag set >> ");
         var optionalMigrateData =
            wizard.wizardData.preupgradeCheckData.optionalData[0].requirements.requiredDstDiskSpace;
            for(var disk in optionalMigrateData) {
               if(requiredDiskList[disk]) {
                  requiredDiskList[disk] =
                        requiredDiskList[disk] + optionalMigrateData[disk];
               }
            }
      }
   }

   $.each(wizard.wizardData.probeData.probeResult.deploymentOptions.deploymentOption, function(index, ele) {
      if (typeof ele.id === 'undefined') {
         return;
      }
      if (nodeType === 'embedded') {
         // Embedded node
         if (ele.id.indexOf('management') == -1 && ele.id.indexOf('infrastructure') == -1) {
            if(wizard.wizardData.migrationFlag) {
               vcsaLogger.info("SizingController - Migrate - check for profiledisk space ");
               var profileData = profileLayout[ele.id];
               if(hostCount < profileData["host-count"] && vmCount < profileData["vm-count"]) {
                  var isDiskSpace = true;
                  for(var disk in profileData) {
                     if(disk.indexOf('disk') != -1) {
                        var diskName = disk.split('-')[1];
                        if(requiredDiskList[diskName]) {
                           if(!(requiredDiskList[diskName] < parseFloat(profileData[disk]))) {
                              isDiskSpace = false;
                           }
                        }
                     }
                  }
                  if(isDiskSpace) {
                     filteredProfiles.push(ele);
                  }
               }
            }else {
               filteredProfiles.push(ele);
            }

         }
      }else if (nodeType === 'management') {
         if (ele.id.indexOf('management') != -1) {
            filteredProfiles.push(ele);
         }
      } else if (nodeType === 'infrastructure') {
         if (ele.id.indexOf('infrastructure') != -1) {
            filteredProfiles.push(ele);
         }
      }
   });
   if(filteredProfiles.length == 0) {
      vcsaLogger.info("SizingController - Not enough vm,hostcount matched with profiles ");
      profileFlag = false;
      wizard.validationBanner.data =
      [{
         text: wizard.localeMap["DeployVcsaSetupAppliancePage.profileSelectError"],
         type:"critical"
      }]
   } else {
      profileFlag = true;
      profileScopeFlag = true;
      $scope.sizeProfiles = filteredProfiles;
      // Preserve selected profile upon navigation
      if (wizard.wizardData.ovfOptions.sizingData) {
         for (i in $scope.sizeProfiles) {
            if (wizard.wizardData.ovfOptions.sizingData.id === $scope.sizeProfiles[i].id){
               wizard.wizardData.ovfOptions.sizingData = $scope.sizeProfiles[i];
               profileScopeFlag = false;
               break;
            }
         }
         if(profileScopeFlag) {
            wizard.wizardData.ovfOptions.sizingData = $scope.sizeProfiles[0];
         }
      } else {
         wizard.wizardData.ovfOptions.sizingData = $scope.sizeProfiles[0];
      }
   }

   angular.extend(wizard.current,{
      onNext: function() {
         if(profileFlag) {
            return true;
         } else {
            return false;
         }
      }
   });
}]);
