/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * wizard wrapper controller.
 * Manages opening and closing of the wizard and
 * also resets the scope.
 */
angular.module('myApp').controller('WizardWrapperController',
      ['$scope', '$timeout',function($scope, $timeout) {
   $scope.showWizard = false;

   $scope.closeWizard = function() {
      $scope.showWizard = false;
   }

   $scope.openWizard = function(objectId, pluginId, localeMap) {
      $scope.showWizard = true;
      $timeout(function() {
         $('#wizardSkeleton').removeClass('hide');
         angular.element($('#ovfWizard')).scope().$apply(function(){
            angular.element($('#ovfWizard')).scope().init(objectId, pluginId, localeMap);
         });
      }, 1000);
   }
}]);