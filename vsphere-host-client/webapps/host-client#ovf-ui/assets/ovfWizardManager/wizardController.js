/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * wizard controller.
 * Houses genric functions that need to communicate with outer scopes.
 */
angular.module('myApp').controller('WizardController',
['$scope',function($scope){
	// Function to call the outer scope function
	// to close the wizard and destroy scope.
   $scope.wizard.onCloseBridge =  function(){
       $scope.closeWizard();
   }
}]);