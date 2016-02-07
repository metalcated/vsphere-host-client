/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * InfrastructureController checks if user had accepted the license.
 */
angular.module('myApp').controller('InfrastructureController',
		['$scope',function($scope) {
	var wizard = $scope.vxWizard;
	angular.extend(wizard.current, {
		onNext: function() {
			// Skip database page for infrastructure node deployments
			if (wizard.wizardData.ovfOptions.nodeType === "infrastructure") {
				// To Remeove Database page
				wizard.pages[wizard.currentIdx + 1].state = "DISABLED";
				wizard.pages[wizard.currentIdx + 2].state = "SKIPPED";
				wizard.pages[wizard.currentIdx + 5].state = "SKIPPED";
			} else if (wizard.wizardData.ovfOptions.nodeType === "management") {
				// To add connect to SSO page
				wizard.pages[wizard.currentIdx + 1].state = "SKIPPED";
				wizard.pages[wizard.currentIdx + 2].state = "DISABLED";
				wizard.pages[wizard.currentIdx + 5].state = "DISABLED";
			} else {
				// Add  configure SSO page in Embedded
				// and infra node deployments.
				wizard.pages[wizard.currentIdx + 1].state = "DISABLED";
				wizard.pages[wizard.currentIdx + 2].state = "SKIPPED";
				wizard.pages[wizard.currentIdx + 5].state = "DISABLED";
			}
		return true;
		}
	});
}]);