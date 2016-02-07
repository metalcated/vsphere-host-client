/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * This Directive loads the wizard body and initializes it.
 * It syles the li steps based on current step index.
 * On Next Button it waits for custom validations from
 * respective page controllers to return true before going to next page.
 */
angular.module('myApp').directive('vxWizard', function($q) {
   return {
      templateUrl: "ovf-ui/assets/ovfWizardManager/wizardBody.html",
      scope: {
         vxWizard: '='
      },
      controller: function($scope) {
         var wizard = $scope.vxWizard;
         wizard.validationBanner = {};
         wizard.validationBanner.data = [];
         wizard.validationBanner.showAllMessages = false;
         // Wizard page states
         wizard.pageState = {
            skipped : "SKIPPED",
            incomplete: "INCOMPLETE",
            disabled : "DISABLED",
            completed : "COMPLETED",
            invalid : "INVALID"
         };
         setupCurrent();
         angular.extend(wizard,{
            currentIdx: 0,
            totalSteps: wizard.pages.length - 1,
            data: {},
            initialize: function() {
               // To handle the case where first page is a skipped page
               while(wizard.pages[wizard.currentIdx].state ===
                     wizard.pageState.skipped &&
                     wizard.totalSteps > wizard.currentIdx ) {
                  wizard.currentIdx++;
               }
               wizard.updatePages();
            },
            onClose: function() {
               // checks for custom close else goes with default.
               if (wizard.customClose) {
                  $q.when(wizard.customClose()).then(function(result){
                     if (!result) {
                        return;
                     }
                     wizard.onCloseBridge();
                  });
               } else {
                  wizard.onCloseBridge();
               }
            },
            onNextClick: function() {
               $q.when(wizard.current.onNext()).then(function(result) {
                  if (!result) {
                     return;
                  }
                  wizard.currentIdx++;
                  while(wizard.pages[wizard.currentIdx].state ===
                        wizard.pageState.skipped &&
                        wizard.totalSteps > wizard.currentIdx ) {
                     wizard.currentIdx++;
                  }
                  wizard.updatePages();
               })
            },
            clearValidationBanner: function() {
               wizard.validationBanner.data = [];
               wizard.validationBanner.showAllMessages = false;
            },
            updatePages: function() {
               wizard.clearValidationBanner();
               // Since this is a traditional wizard where the next page depends
               // on the previous pages completion, marking page's state accordingly.
               for (var i = 0; i < wizard.totalSteps; i++) {
                  if (wizard.pages[i].state === wizard.pageState.skipped) {
                     continue;
                  } else if(i < wizard.currentIdx) {
                     wizard.pages[i].state = wizard.pageState.completed;
                  } else {
                     wizard.pages[i].state = wizard.pageState.disabled;
                  }
               }
            },
            criteriaMatch: function(pageState) {
               return pageState !== wizard.pageState.skipped;
            },
            getStepClass: function(pageState, pageIndex) {
               if (pageIndex === wizard.currentIdx) {
                  return "wizard-steps-current";
               }
               else if (pageState === wizard.pageState.disabled) {
                  return "wizard-steps-not-available";
               } else if (pageState === wizard.pageState.completed) {
                  return "wizard-steps-completed";
               }
            },
            validationBannerVisible: function() {
               return wizard.validationBanner.data.length > 0 ? true : false;
            },
            getValidationBannerStyle: function() {
               // to set left position based on if TOC is shown or not
               // specific to only the installer and not generic.
               if (wizard.wizardData.showProgress) {
                  return {left: '5px'};
               }
               return {};
            },
            getValidationMessageClass: function(msgType) {
               return msgType === "warning" ? "iconWarning16" : "iconCritical16" ;
            },
            getValidationBannerClass: function() {
               return wizard.validationBanner.showAllMessages ?
                     "wizard-validation-show-all" : "wizard-validation-show-one";
            },
            ifShowAllMessagesEnabled: function() {
               return ((wizard.validationBanner.data.length > 1) &&
                     !wizard.validationBanner.showAllMessages);
            },
            ifHideMessagesEnabled: function() {
               return ((wizard.validationBanner.data.length > 1) &&
                     wizard.validationBanner.showAllMessages);
            },
            hideMessages: function() {
               wizard.validationBanner.showAllMessages = false;
            },
            showAllMessages: function() {
               wizard.validationBanner.showAllMessages = true;
            }
         });
         // call the very first time to initialize.
         wizard.initialize();

         function setupCurrent() {
            wizard.current = {
               onNext: function(){
                  return true;
               }
            };
         }
      }
   };
});