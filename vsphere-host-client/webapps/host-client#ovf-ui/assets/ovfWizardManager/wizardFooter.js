/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * This Directive loads the wizard footer buttons.
 * Disbale or enables the buttons based on the current step.
 */
angular.module('myApp').directive('vxWizardButtons', function(){
   return {
      templateUrl: "ovf-ui/assets/ovfWizardManager/wizardFooter.html",
      scope: {
         vxWizard: '=vxWizardButtons'
      },
      controller: function($scope){
         var wizard = $scope.vxWizard;
         wizard.stateHelper = function () {
            if (wizard.currentIdx === wizard.totalSteps) {
               return false;
            }
            var counter = wizard.currentIdx + 1;
            // To handle the case where last page is a skipped page
            while (counter <= wizard.totalSteps) {
               if (wizard.pages[counter++].state !== wizard.pageState.skipped) {
                  return true;
               }
            }
            return false;
         };
         angular.extend($scope,{
            disableBack: function(){
               return wizard.currentIdx == 0 ;
            },
            disableNext: function() {
               return !wizard.stateHelper();
            },
            disableFinish:function() {
               return wizard.stateHelper();
            },
            onBackClick: function() {
               wizard.currentIdx--;
               while(wizard.pages[wizard.currentIdx].state === "SKIPPED") {
                  wizard.currentIdx--;
               }
               wizard.updatePages();
            },
            onNextClick: function() {
               wizard.onNextClick();
            }
         });
      }
   };
});