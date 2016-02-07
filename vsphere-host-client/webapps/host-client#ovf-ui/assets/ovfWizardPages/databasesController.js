/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * Databases controller.
 */
angular.module('myApp').controller('DatabasesController',
['$scope',function($scope){
   var wizard = $scope.vxWizard;
   $scope.dbType = 'embedded';

   wizard.databasesDataFormDisable = function(){
      return $scope.dbType === 'embedded' ? true : false;
   }

   angular.extend(wizard.current,{
      onNext: function() {
         if (($scope.dbType==='external') && $scope.databasesDataForm.$invalid) {
            wizard.validationBanner.data =
                  [{text:"Please fill the required fields to Proceed.",
                  type:"critical"}];
            return false;
         }
         wizard.wizardData.ovfOptions.databaseData.dbType = $scope.dbType;
         return true;
      }
   });
}]);