/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * MigrationInfoController to collect migration info and validate.
 * Thumbprints are to be verified by the user.
 * After thumbprint verification pre-upgrade check is called
 * optionalBits are to be set based on user optiona and pre-upgrade checks.
 * Deployment Profile has to be selected based on the pre-upgrade result.
 * Check for export path size has to be performed based on pre-upgrade check result.
 */
angular.module('myApp').controller('MigrationInfoController',
      ['$scope', '$q', '$http', 'blocker', function($scope, $q, $http, blocker) {
   var wizard = $scope.vxWizard;
   $scope.submitted = false;
   // Checks if error class has to be applied to control-group based on
   // form state.
   $scope.addErrorClass = function(elem) {
      return elem.$invalid && $scope.submitted;
   }
   $scope.showRequiredError = function(elem) {
      return elem.$error.required && $scope.submitted;
   }
   $scope.showInvalidIpError = function(elem) {
      return !elem.$error.required && elem.$error.isIp && $scope.submitted;
   }
   $scope.isDeployment55  = function() {
      return wizard.wizardData.sourceNodeType.value === "55" ? true : false;
   }

   angular.extend(wizard.current, {
      onNext: function() {
         $scope.submitted = true;
         if($scope.isDeployment55()) {
            wizard.wizardData.ovfOptions.migrationData.vpxdUser =
                  "administrator@vsphere.local";
         }
         if($scope.migrationDataForm.$invalid) {
            // Ignore validation error if it's
            if (!$scope.isDeployment55() || $scope.migrationDataForm.$error.required.length != 1 ||
                  $scope.migrationDataForm.$error.required[0].$name !== "vpxdUser") {
               return false;
            }
         }

         wizard.wizardData.ovfOptions.migrationData.optionalBits = [{"vcdb.seatMigration" :
               wizard.wizardData.ovfOptions.migrationData.optionalBitsFlag}];

         return getThumbprint().then(function(succeeded) {
            return succeeded;
         });
         // TODO
         // Compute optionalBits based on pre-upgraede check data and user option
         // for optionalBitsFLag and construct somethings liek this
         // optionalBits = [{"migrate_seat[1]" : 'yes'}.]
         // Pass down data base info form pre-upgrade checks by setting the respective
         // ovf params for database
      }
   });

   getThumbprint = function() {
      var deferredPromise = $q.defer();

      // Get thumbprints
      blocker.blockUI();
      var thumbprintsData = {
         hostIP: wizard.wizardData.ovfOptions.migrationData.hostIp
      };
      $.ajax({
         type: "POST",
         url: "messagebroker/getThumbprints",
         data: thumbprintsData,
         dataType: "JSON"
      })
      .done(function(data) {
         if (data['error'] && $.isArray(data.error) && data.error.length > 0) {
            var validationBannerData = [];
            $.each(data.error, function(i, ele) {
               validationBannerData.push({
                  text: ele.localized,
                  type:"critical"
               })
            });
            $scope.$apply(wizard.validationBanner.data = validationBannerData);
            blocker.unBlockUI();
            $scope.$apply(deferredPromise.resolve(false));
            return;
         }


         wizard.wizardData.ovfOptions.migrationData.guestThumbprint =
               data.thumbprint[thumbprintsData.hostIP];

         performPreupgradeCheck(deferredPromise);
      })
      .fail(function(data) {
         blocker.unBlockUI();
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.unknownError"],
            type:"critical"}]);
         $scope.$apply(deferredPromise.resolve(false));
         return;
      });

      return deferredPromise.promise;
   }

   // Perform preupgrade check
   performPreupgradeCheck = function(deferredPromise) {
      var ovfSource = '';

      if (wizard.wizardData.ovfSourceLocalPath !== "") {
         ovfSource = wizard.wizardData.ovfSourceLocalPath;
      } else if (wizard.wizardData.ovfSource !== "") {
         ovfSource = wizard.wizardData.ovfSource;
      }

      var preupgradeCheckData = {
            hostIP: wizard.wizardData.ovfOptions.migrationData.hostIp,
            hostThumbprint: wizard.wizardData.ovfOptions.migrationData.guestThumbprint,
            hostUsername: wizard.wizardData.ovfOptions.migrationData.hostUser,
            hostPassword: wizard.wizardData.ovfOptions.migrationData.hostPassword,
            sourceVMUsername: wizard.wizardData.ovfOptions.migrationData.guestUser,
            sourceVMPassword: wizard.wizardData.ovfOptions.migrationData.guestPassword,
            sourceIP: wizard.wizardData.ovfOptions.migrationData.vpxdIp,
            sourceVcUsername: wizard.wizardData.ovfOptions.migrationData.vpxdUser,
            sourceVcPassword: wizard.wizardData.ovfOptions.migrationData.vpxdPassword,
            ovfOvaPath: ovfSource,
            upgradeType: 'embedded' // TODO leave it hard coded for now
      }
      $.ajax({
         type: "POST",
         url: "messagebroker/performPreUpgradeCheck",
         data: preupgradeCheckData,
         dataType: "JSON"
      })
      .done(function(data) {
         blocker.unBlockUI();

         var preUpgradeCheckSucceeded = false;
         preUpgradeCheckSucceeded =
               requirementMismatchCheck(data.requirementsMismatch);
         if (!preUpgradeCheckSucceeded) {
            // No need to do further checks
            $scope.$apply(deferredPromise.resolve(preUpgradeCheckSucceeded));
            return;
         }

         if (wizard.wizardData.ovfOptions.migrationData.exportPath) {
            preUpgradeCheckSucceeded =
                  exportPathCheck(data.requirements, data.sourceInfo, data.optionalData);
         } else {
            preUpgradeCheckSucceeded =
                  sourceRequirementCheck(data.requirements, data.sourceInfo, data.optionalData);
         }

         preUpgradeCheckSucceeded &=
               processOvfParameter(data.installInfo.ovfParameter);

         // Store the whole data object for future use
         wizard.wizardData.preupgradeCheckData = data;
         $scope.$apply(deferredPromise.resolve(preUpgradeCheckSucceeded));
      })
      .fail(function(data) {
         blocker.unBlockUI();
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.unknownError"],
            type:"critical"}]);
         $scope.$apply(deferredPromise.resolve(false));
         return;
      });
   }

   requirementMismatchCheck = function(data) {
      var hasNoError = true;
      if (data != null &&
            (($.isArray(data.error) && data.error.length > 0) ||
            ($.isArray(data.warning) && data.warning.length > 0))) {
         // TODO handle errors and warnings separately. Return true if it's just warning
         var validationBannerData = [];
         if (data.error.length > 0) {
            hasNoError = false;
            $.each(data.error, function(i, ele) {
               validationBannerData.push({
                  text: ele.text.localized,
                  type:"critical"
               });
            });
         }
         if (data.warning.length > 0) {
            $.each(data.warning, function(i, ele) {
               validationBannerData.push({
                  text: ele.text.localized,
                  type:"warning"
               });
            });
         }
         $scope.$apply(wizard.validationBanner.data = validationBannerData);
      }
      return hasNoError;
   }

   sourceRequirementCheck = function(requirementsData, sourceInfoData, optionalData) {
      if (sourceInfoData == null || requirementsData == null) {
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.unknownError"],
            type:"critical"
         }]);
         return false;
      }

      var requiredSrcDiskSpace = requirementsData.requiredSrcDiskSpace;

      // Check optional data if optionalBitsFlag is set
      if (wizard.wizardData.ovfOptions.migrationData.optionalBitsFlag &&
            optionalData != null && $.isArray(optionalData)) {
         $.each(optionalData, function(i, ele) {
            if (!requirementMismatchCheck(ele.requirementsMismatch)) {
               return;
            }

            requiredSrcDiskSpace += ele.requirements.requiredSrcDiskSpace;
         });
      }

      if (requiredSrcDiskSpace == 0) {
         // No need to do any checks
         return true;
      }

      //TODO: may make this field required or have a default value
      var sourceDiskInfo = sourceInfoData.diskInfo;
      if (sourceDiskInfo != null && $.isArray(sourceDiskInfo)) {
         var largetDiskSize = 0;
         for (var i = 0; i < sourceDiskInfo.length; i++) {
            if (sourceDiskInfo[i].free && sourceDiskInfo[i].free > largetDiskSize) {
               largetDiskSize = sourceDiskInfo[i].free;
               wizard.wizardData.ovfOptions.migrationData.exportPath = sourceDiskInfo[i].mountedOn;
            }
         }
         if (requiredSrcDiskSpace > largetDiskSize) {
            $scope.$apply(wizard.validationBanner.data = [{
               text: "Not enough space on source",//wizard.localeMap["DeployVcsaSetupAppliancePage.notEnoughSpace"],
               type:"critical"
            }]);
            return false;
         }
         return true;
      } else {
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.unknownError"],
            type:"critical"
         }]);
         return false;
      }
   }

   exportPathCheck = function(requirementsData, sourceInfoData, optionalData) {
      vcsaLogger.info("Inside exportPathCheck function >> ");
      if (sourceInfoData == null || requirementsData == null) {
         vcsaLogger.info("Error in preupgrade json data - sourceInfoData >>");
         vcsaLogger.info("Error in preupgrade json data - requirementsData>>");
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.exportPathSourceDiskError"],
            type:"critical"
         }]);
         return false;
      }

      //TODO: Add logic to check the closest input match. I.e. /storage/db and /
      // should be matched to /storage/db/
      var requiredSrcDiskSpace = requirementsData.requiredSrcDiskSpace,
         path = wizard.wizardData.ovfOptions.migrationData.exportPath,
         diskInfo = sourceInfoData.diskInfo,
         diskPath = {},
         pathList = path.split('/'),
         pathListLength = pathList.length,
         pathFlag = false;

      if(pathList[0] != "") {
         vcsaLogger.info("ExportPath does not start with / >>");
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.exportPathMatchError"],
            type:"critical"
         }]);
         return false;
      }
      if(diskInfo != null && $.isArray(diskInfo)) {
         for (var i=0;i<diskInfo.length;i++) {
            var mountedOn = diskInfo[i]["mountedOn"];
            diskPath[mountedOn] = {};
            diskPath[mountedOn] = diskInfo[i];
         }
      } else {
         vcsaLogger.info("Error in preupgrade json data - diskInfo >> " + diskInfo);
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.exportPathSourceDiskError"],
            type:"critical"
         }]);
         return false;
      }
      // Check optional data if optionalBitsFlag is set
      if (wizard.wizardData.ovfOptions.migrationData.optionalBitsFlag &&
            optionalData != null && $.isArray(optionalData)) {
         vcsaLogger.info("Optional Flag set >> ");
         $.each(optionalData, function(i, ele) {
            if (!requirementMismatchCheck(ele.requirementsMismatch)) {
               return;
            }
            requiredSrcDiskSpace += ele.requirements.requiredSrcDiskSpace;
         });
      }

      while(pathListLength > 0 ) {
         var pathToCheck = pathList.join('/');
         pathList.pop();
         if(pathListLength == 1) {
            pathToCheck = "/";
         }
         if(diskPath[pathToCheck]) {
            pathFlag = true;
            if(diskPath[pathToCheck]["free"] > requiredSrcDiskSpace) {
               return true;
            }
            else {
               vcsaLogger.info("Not Enough disk space on given export path  >> ");
               $scope.$apply(wizard.validationBanner.data = [{
                  text: wizard.localeMap["DeployVcsaSetupAppliancePage.exportPathDiskError"],
                  type:"critical"
               }]);
               return false;
            }
         }
         else {
            pathFlag = false;
         }
         pathListLength = pathListLength - 1;
      }

      if (!path || !pathFlag) {
         vcsaLogger.info("Error, Export path does not match  >> ");
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.exportPathMatchError"],
            type:"critical"
         }]);
         return false;
      }

      var sourceDiskInfo = sourceInfoData.diskInfo;
      if (sourceDiskInfo != null && $.isArray(sourceDiskInfo)) {
         for (var i = 0; i < sourceDiskInfo.length; i++) {
            if (sourceDiskInfo[i].mountedOn === path
                  && sourceDiskInfo[i].free > requiredSrcDiskSpace) {
               return true;
            }
         }
      }
      $scope.$apply(wizard.validationBanner.data = [{
         text: wizard.localeMap["DeployVcsaSetupAppliancePage.unknownError"],
         type:"critical"
      }]);
      return false;
   }

   processOvfParameter = function(data) {
      if (data == null || !$.isArray(data)) {
         $scope.$apply(wizard.validationBanner.data = [{
            text: wizard.localeMap["DeployVcsaSetupAppliancePage.unknownError"],
            type:"critical"
         }]);
         return false
      }

      for (var i = 0; i < data.length; i++) {
         var item = data[i];
         // TODO cgu: make this more generic
         if (item.key.indexOf('db') != -1) {
            // Database values
            switch (item.key) {
               case 'db.type':
                  wizard.wizardData.ovfOptions.databaseData.dbType = item.value;
                  break;
               case 'db.user':
                  wizard.wizardData.ovfOptions.databaseData.dbUsername = item.value;
                  break;
               case 'db.password':
                  wizard.wizardData.ovfOptions.databaseData.dbPassword = item.value;
                  break;
               case 'db.servername':
                  wizard.wizardData.ovfOptions.databaseData.dbServerName = item.value;
                  break;
               case 'db.serverport':
                  wizard.wizardData.ovfOptions.databaseData.dbServerPort = item.value;
                  break;
               case 'db.instance':
                  wizard.wizardData.ovfOptions.databaseData.dbInstance = item.value;
                  break;
               default:
                  // Do nothing
            }
         }
      }
      return true;
   }
}]);
