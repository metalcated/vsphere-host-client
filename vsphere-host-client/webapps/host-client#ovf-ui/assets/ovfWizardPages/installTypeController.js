/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * InstallController for user to select install/migrate.
 * If user selects migrate then he selects the type of node
 */
angular.module('myApp').controller('InstallTypeController',
      ['$scope', function($scope) {
   var wizard = $scope.vxWizard;
   $scope.warningMigrationMessage =
         wizard.localeMap["DeployVcsaInstallTypePage.migrationWarningMessage"];
   $scope.checkInstallType = function() {
     return wizard.wizardData.migrationFlag &&
            $scope.vxWizard.wizardData.sourceNodeType.text ==
                  wizard.localeMap["DeployVcsaInstallTypePage.50Embedded"];
   }
   angular.extend(wizard.current, {
      onNext: function() {
         if (wizard.wizardData.migrationFlag) {
            // set the embedded node if it's upgrade
            wizard.wizardData.ovfOptions.nodeType = 'embedded';
         }
         return true;
      }
   });
}]);
