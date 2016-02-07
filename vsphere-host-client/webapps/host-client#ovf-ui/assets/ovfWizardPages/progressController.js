/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * Progress controller.
 */
angular.module('myApp').controller('ProgressController',
['$scope', '$http', '$timeout', 'ovfHelper',function($scope, $http, $timeout, ovfHelper) {
   var wizard = $scope.vxWizard;
   var CONTENT_TYPE = 'application/x-www-form-urlencoded; charset=UTF-8';
   var migrationFlag = wizard.wizardData.migrationFlag;
   // Progress bar calculations based on migration/install path
   // Install  = .4 + .05 + .1 + .45
   // Migration = .2 + .05 + .1 + .2 + .2 + .2
   var deploymentPercent = migrationFlag ? .2 : .4;
   var powerOnPercent = .05;
   var rpmPercent = .1;
   var firstbootPercent = migrationFlag ? .2 : .45;
   var exportPercent = .2;
   var importPercent = .2;
   // // The list of steps are prone to change.
   // var migrateSteps = [
   //       { name: wizard.localeMap["DeployVcsaProgressPage.downloadingAppliance"],
   //             state: "INCOMPLETE"},
   //       { name: wizard.localeMap["DeployVcsaProgressPage.powerOnAppliance"],
   //             state: "INCOMPLETE"},
   //       { name: wizard.localeMap["DeployVcsaProgressPage.executingFirstbootScripts"],
   //             state: "INCOMPLETE"},
   //       { name: wizard.localeMap["DeployVcsaProgressPage.executingMigrationScripts"],
   //             state: "INCOMPLETE"}];
   // var installSteps = [
   //       { name: wizard.localeMap["DeployVcsaProgressPage.downloadingAppliance"],
   //             state: "INCOMPLETE"},
   //       { name: wizard.localeMap["DeployVcsaProgressPage.powerOnAppliance"],
   //             state: "INCOMPLETE"},
   //       { name: wizard.localeMap["DeployVcsaProgressPage.executingFirstbootScripts"],
   //             state: "INCOMPLETE"},
   //       { name: wizard.localeMap["DeployVcsaProgressPage.startingApplianceServices"],
   //             state: "INCOMPLETE"}];
   // $scope.progressSteps = wizard.wizardData.migrationFlag ? migrateSteps : installSteps;
   // var currentIdx = 0;
   // var totalSteps = $scope.progressSteps.length;
   // var firstbootStartFlag = false;
   $scope.progressPercent = 0;
   var progressIntermediate = 0;
   var firstbootRecursion = true;
   var rpmRecursion = true;
   var migrationRecursion = true;
   var importRecursion = true;
   var exportRecursion = true;
   $scope.showIp = false;
   $scope.isHostName = false;
   $scope.errorHostName = false;
   wizard.wizardData.ip = "";
   wizard.wizardData.canceled = false;
   $scope.domainName = "";
   $scope.finalHostName = "";

   // // To update the progress steps in the UI.
   // updateProgressSteps = function() {
   //    for (var i = 0; i < currentIdx; i++) {
   //       $scope.progressSteps[i].state = 'COMPLETED';
   //    }
   //    $scope.progressSteps[currentIdx].state = 'CURRENT';
   //    for (var i = currentIdx + 1; i < totalSteps; i++) {
   //       $scope.progressSteps[i].state = 'INCOMPLETE';
   //    }
   //    currentIdx = currentIdx + 1;
   // }

   // Calls ovfExecute with calback function.
   init = function() {
      wizard.wizardData.progress.text =
            wizard.localeMap["DeployVcsaProgressPage.initializing"];
      wizard.getOptions(function(options) {
         ovfHelper.execute(wizard.wizardData.ovfVar.pluginId,
               wizard.wizardData.ovfVar.ticket,
               options, wizard.localeMap, progressCallback);
      });
   }

   // To finish Installer Final step
   completeFinalStep = function() {
      vcsaLogger.info("Entered the completefinalstep in progresscontroller >> ");
      clearTimer = $timeout(function servicesStartupProgress() {
         if ($scope.progressPercent >= 100) {
            vcsaLogger.info("100% Complete during install/migrate >> ");
            var vmID = wizard.wizardData.progress.vmRef.split('.')[1];
            if (migrationFlag) {
               vcsaLogger.info("Migration Complete >> ");
               // set the reconfigured IP
               wizard.wizardData.ip =
                     wizard.wizardData.ovfOptions.migrationData.vpxdIp;
               if(wizard.wizardData.sourceNodeType.value === "55") {
                  $scope.domainName = "vsphere.local";
               }
               wizard.wizardData.progress.text =
                     wizard.localeMap["DeployVcsaProgressPage.migrationCompleted"];
            } else {
               // Set static IP if user had specified one
               if (wizard.wizardData.ovfOptions.networkData.netMode === "static") {
                  vcsaLogger.info("Static network mode set in the install phase >> ");
                  $scope.finalHostName =
                        wizard.wizardData.ovfOptions.networkData.hostName;
                  wizard.wizardData.ip =
                        wizard.wizardData.ovfOptions.networkData.netAddr;
                  $scope.isHostName = true;
               } else if((wizard.wizardData.ovfOptions.networkData.netMode != "static" &&
                     wizard.wizardData.ovfOptions.networkData.hostName === '') ||
                     wizard.wizardData.ovfOptions.networkData.netMode === "autoconf") {
                  vcsaLogger.info("No HostName. Starting to fetch IP using MOB >> ");
                  $http.get("messagebroker/hostdata/properties/urn:vmomi:"+ vmID +"?properties=guest.ipAddress")
                  .success(
                     function(result,status){
                        vcsaLogger.info("Received the IP object >> " + result);
                        $scope.isHostName = true;
                        var tempHostName = result["guest.ipAddress"];
                        $scope.finalHostName = tempHostName;
                     }
                  )
                  .error(
                     function(result,status) {
                        $scope.isHostName = false;
                        $scope.errorMessageHostName =
                            wizard.localeMap["DeployVcsaProgressPage.errorHostName"];
                        $scope.errorHostName = true;
                        vcsaLogger.info("Error in fetcing the IP >> " + status);
                     }
                  );
               } else {
                  $scope.finalHostName =
                        wizard.wizardData.ovfOptions.networkData.hostName;
                  $scope.isHostName = true;
               }
               if (wizard.wizardData.ovfOptions.nodeType === "management") {
                  vcsaLogger.info("Install complete for management node >> ");
                  $scope.domainName =
                        wizard.wizardData.ovfOptions.ssoNodeData.ssoDomainName;
               } else {
                  $scope.domainName =
                        wizard.wizardData.ovfOptions.passwordData.ssoDomainName;
               }
               wizard.wizardData.progress.text =
                     wizard.localeMap["DeployVcsaProgressPage.installationComplete"];
            }
            //$scope.progressSteps[totalSteps - 1].state = "COMPLETED";
            // No NGC Url for infar node
            if (wizard.wizardData.ovfOptions.nodeType === "infrastructure") {
               $scope.showIp = false;
            } else {
               $scope.showIp = true;
            }
            $scope.$apply();
            return;
         }
         $scope.progressPercent += 1;
         $scope.$apply();
         clearTimer = $timeout(servicesStartupProgress, 5000);
      }, 5000);
   }

   // Fetches import phase progress json file to report progress/failure.
   importProgress = function() {
      clearTimer = $timeout(function getImportProgress() {
         params = $.param({vmRef : wizard.wizardData.progress.vmRef,
            vmUsername : 'root',
            vmPassword : wizard.wizardData.ovfOptions.passwordData.rootPassword,
            vmFileId : 3
         });
         $http({
            url: "messagebroker/getProgressFile",
            data: params,
            method: 'POST',
            headers: {
                  'Content-Type': CONTENT_TYPE
            }}).success(function(result){
               // To ignore/invalid delayed response.
               if (!importRecursion) {
                  return;
               }
               if (result.status === "error") {
                  $timeout.cancel(clearTimer);
                  wizard.wizardData.progress.text =
                        wizard.localeMap["DeployVcsaProgressPage.migrationFailed"];
                  if (result.error.detail) {
                     result.error.detail.map(function(e) {
                        wizard.validationBanner.data.push({text: e.localized, type:"critical"});
                     });
                  }
                  // To stop sucessive recursion calls.
                  importRecursion = false;
                  return;
               }
               $scope.progressPercent = progressIntermediate + (result.progress * importPercent);
               if (result.progress_message) {
                  wizard.wizardData.progress.text = result.progress_message.localized;
               } else if (result.summary.status == 'success') {
                  importRecursion = false;
                  completeFinalStep();
                  //$scope.progressSteps[totalSteps - 1].state = "COMPLETED";
               }
            }).error(function(x,msg) {
               // TODO mthirunavukkar - Log error in a log file.
         });
         // To refersh view.
         $scope.$apply();
         if (importRecursion) {
            clearTimer = $timeout(getImportProgress, 5000);
         }
      }, 5000);
   }

   // Fetches firstboot progress file to report progress/failure.
   firstbootProgress = function() {
      clearTimer = $timeout(function getFirstbootProgress() {
         params = $.param({vmRef : wizard.wizardData.progress.vmRef,
               vmUsername :'root',
               vmPassword : wizard.wizardData.ovfOptions.passwordData.rootPassword,
               vmFileId : 1
         });
         $http({
            url: "messagebroker/fetchProgressFile",
            data:params,
            method : 'POST',
            headers : {
                  'Content-Type':CONTENT_TYPE
            }}).success(function(result){
               // To ignore delayed/invalid response
               if (!firstbootRecursion) {
                  return;
               }
               if (result.status === "error") {
                  $timeout.cancel(clearTimer);
                  wizard.wizardData.progress.text =
                        wizard.localeMap["DeployVcsaProgressPage.installationFailed"];
                  // Remove this in future
                  wizard.validationBanner.data =
                        [{text: wizard.localeMap["DeployVcsaProgressPage.errorFirstbootScripts"],
                        type:"critical"}];
                  if (result.error.detail) {
                     result.error.detail.map(function(e) {
                        wizard.validationBanner.data.push({text: e.localized, type:"critical"});
                     });
                  }
                  // To stop sucessive recursion calls.
                  firstbootRecursion = false;
                  return;
               }
               $scope.progressPercent = progressIntermediate + (result.progress * firstbootPercent);
               if (result.progress_message) {
                  wizard.wizardData.progress.text = result.progress_message.localized;
               }
               if (result.status === "success") {
                  firstbootRecursion = false;
                  progressIntermediate = $scope.progressPercent;
                  //updateProgressSteps();
                  wizard.wizardData.progress.text = "";
                  if (wizard.wizardData.migrationFlag) {
                     importProgress();
                  } else {
                     completeFinalStep();
                  }
               }
            }).error(function(x,msg) {
               // TODO mthirunavukkar - Log error in a log file.
            });
         // To refersh view.
         $scope.$apply();
         if (firstbootRecursion) {
            clearTimer = $timeout(getFirstbootProgress, 5000);
         }
      }, 5000);
   }

   // Fetches progress for export phase in migration
   // This phase is after rpm install and before firstboot.
   exportProgress = function() {
      clearTimer = $timeout(function getExportProgress() {
         params = $.param({vmRef : wizard.wizardData.progress.vmRef,
               vmUsername : 'root',
               vmPassword : wizard.wizardData.ovfOptions.passwordData.rootPassword,
               vmFileId : 2
         });
         $http({
            url: "messagebroker/fetchProgressFile",
            data:params,
            method : 'POST',
            headers : {
                  'Content-Type':CONTENT_TYPE
            }}).success(function(result){
               // To ignore delayed/invalid response
               if (!exportRecursion) {
                  return;
               }
               if (result.status === "error") {
                  $timeout.cancel(clearTimer);
                  wizard.wizardData.progress.text =
                        wizard.localeMap["DeployVcsaProgressPage.migrationFailed"];
                  if (result.error.detail) {
                     result.error.detail.map(function(e) {
                        wizard.validationBanner.data.push({text: e.localized, type:"critical"});
                     });
                  }
                  // To stop sucessive recursion calls.
                  exportRecursion = false;
                  return;
               }
               $scope.progressPercent = progressIntermediate + (result.progress * exportPercent);
               if (result.progress_message) {
                  wizard.wizardData.progress.text = result.progress_message.localized;
               }
               if (result.status === "success") {
                  exportRecursion = false;
                  progressIntermediate = $scope.progressPercent;
                  //updateProgressSteps();
                  wizard.wizardData.progress.text = "";
                  firstbootProgress();
               }
            }).error(function(x,msg) {
               // TODO mthirunavukkar - Log error in a log file.
            });
         // To refersh view.
         $scope.$apply();
         if (exportRecursion) {
            clearTimer = $timeout(getExportProgress, 5000);
         }
      }, 5000);
   }

   // Fetches firstbootStatus.json file to report progress/failure.
   rpmInstallProgress = function() {
      clearTimer = $timeout(function getRpmInstallProgress() {
         params = $.param({vmRef:wizard.wizardData.progress.vmRef,
               vmUsername:'root',
               vmPassword: wizard.wizardData.ovfOptions.passwordData.rootPassword,
               vmFileId: 0
         });
         $http({
            url: "messagebroker/fetchProgressFile",
            data:params,
            method : 'POST',
            headers : {
                  'Content-Type':CONTENT_TYPE
            }}).success(function(result) {
               // To ignore delayed/invalid response
               if (!rpmRecursion) {
                  return;
               }
               if (result.status === "error") {
                  $timeout.cancel(clearTimer);
                  wizard.wizardData.progress.text =
                        wizard.localeMap["DeployVcsaProgressPage.installationFailed"];
                  if (result.error.detail) {
                     result.error.detail.map(function(e) {
                        wizard.validationBanner.data.push({text: e.localized, type:"critical"});
                     });
                  }
                  // To stop sucessive recursion calls.
                  rpmRecursion = false;
                  return;
               }
               $scope.progressPercent = progressIntermediate + (result.progress * rpmPercent);
               if (result.progress_message) {
                  wizard.wizardData.progress.text = result.progress_message.localized;
               } else {
                  wizard.wizardData.progress.text = "Installing RPMs";
               }
               if (result.status === "success") {
                  rpmRecursion = false;
                  progressIntermediate = $scope.progressPercent;
                  //updateProgressSteps();
                  wizard.wizardData.progress.text = "";
                  if (wizard.wizardData.migrationFlag) {
                     exportProgress();
                  } else {
                     firstbootProgress();
                  }
               }
            }).error(function(x,msg) {
               // TODO mthirunavukkar - Log error in a log file.
            });
         // To refersh view.
         $scope.$apply();
         if (rpmRecursion) {
            clearTimer = $timeout(getRpmInstallProgress, 5000);
         }
      }, 5000);
   }

   // OVf execute progress callback.
   // Called from ovfService.
   progressCallback = function(result) {
      if (result.status) {
         wizard.validationBanner.data =
               [{text: wizard.localeMap[result.message], type:"critical"}];
         wizard.wizardData.progressClose = true;
      } else if (result.errors) {
         //Handle and show all the type of errors from the ovf probe,verify and execute functions.
         wizard.validationBanner.data =
               [{text:result.errors.Error.LocalizedMsg, type:"critical"}];
         wizard.wizardData.progress.text =
               wizard.localeMap["DeployVcsaProgressPage.errorDuringInstallation"];
         wizard.wizardData.progressClose = true;
       } else if (result.complete) {
         wizard.wizardData.progressClose = true;
         progressIntermediate = $scope.progressPercent;

         if (wizard.wizardData.canceled) {
            wizard.wizardData.progress.text =
                  wizard.localeMap["DeployVcsaProgressPage.deploymentCancelledByUser"];
         } else {
            // on Success
            wizard.wizardData.progress.text = "";
            wizard.wizardData.progress.vmRef = result.vmRef;
            wizard.wizardData.ip = result.ip;
            rpmInstallProgress();
         }
      } else if(result.powerOnProgress) {
         wizard.wizardData.progress.text =
               wizard.localeMap["DeployVcsaProgressPage.powerOnAppliance"];
         $scope.progressPercent = progressIntermediate +
               Math.ceil(result.powerOnProgress *  powerOnPercent);
         wizard.wizardData.progress.percent =
               {width: $scope.progressPercent + "%"};
      } else {
         // Ovf download and deploy accounts for 40% progress.
         wizard.wizardData.progress.text =
               wizard.localeMap["DeployVcsaProgressPage.downloadingAppliance"];
         $scope.progressPercent = Math.ceil(result.progress * deploymentPercent);
         progressIntermediate = $scope.progressPercent;
         wizard.wizardData.progress.percent =
               {width: $scope.progressPercent + "%"};
      }
      // To refersh view.
      $scope.$apply();
   }

   // Function to return the class for the progress steps
   // based on the currentIndex.
   $scope.getStepClass = function(state) {
      if (state === 'INCOMPLETE') {
         return "wizard-steps-not-available";
      } else if (state === 'COMPLETED') {
         return "wizard-steps-completed";
      } else {
         return "wizard-steps-current";
      }
   }

   // Initialization happens here.
   init();
   //updateProgressSteps();
}]);

/**
 * ProgressFooterButtonsController collects the option and
 * passses triggers execute.
 */
angular.module('myApp').controller('ProgressFooterButtonsController',
['$scope',function($scope){
   var wizard = $scope.vxWizard;

   wizard.cancel = function() {
      wizard.wizardData.canceled = true;
      var status = ovfCancel(wizard.wizardData.ovfVar.pluginId,
            wizard.wizardData.ovfVar.ticket);
   }
}]);
