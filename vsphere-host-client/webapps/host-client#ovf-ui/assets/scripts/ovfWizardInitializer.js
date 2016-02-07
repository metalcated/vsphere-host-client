/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

// To load the scripts required and bootstrap the wizard.
// TODO mthirunavukar Injected from flex.

// Configure vcsa logger
// Fire an event form the iframe housing host-client. Event is capturd by the
// parent Node Webkit js and then the ifo is logged.
vcsaLogger = {};
vcsaLogger.info = function(data) {
   // Create the event
   var event = new CustomEvent("vcsa_log", { "detail": data });
   // Dispatch/Trigger/Fire the event
   document.body.dispatchEvent(event);
}

// Function invoked only from flex.
// Invoked by DeploycloudVM action resolver
// which is host-client specific so
// this will not have any impact on vim-clients
function bootstrapWizard() {
   // Just to make sure that this is called only once.
   if (typeof(myApp)==="undefined") {
      myApp = angular.module('myApp', ['ngGrid']);

      $(document).ready(function() {

         $('head').append('<link type="text/css"'+
               ' href="ovf-ui/assets/css/installer-bootstrap.css" rel="stylesheet" />'+
               '<link type="text/css" href="ovf-ui/assets/css/ng-grid.min.css"'+
               ' rel="stylesheet" />');

         // Loading the raw javascript way as Jquery does an eval and so scripts
         // will be available as resources.
         var head = document.getElementsByTagName("head");
         head = head[0];
         var scriptsArray = [
               "ovf-ui/assets/jsLibs/blockUI.js",
               "ovf-ui/assets/jsLibs/xmlParser.js",
               "ovf-ui/assets/ovfWizardManager/IpUtil.js",
               "ovf-ui/assets/ovfWizardManager/deployUtil.js",
               "ovf-ui/assets/ovfWizardManager/wizardWrapperController.js",
               "ovf-ui/assets/ovfWizardManager/wizardController.js",
               "ovf-ui/assets/ovfWizardManager/ovfDeployController.js",
               "ovf-ui/assets/ovfWizardManager/wizardBody.js",
               "ovf-ui/assets/ovfWizardManager/wizardFooter.js",
               "ovf-ui/assets/ovfWizardManager/customValidationDirectives.js",
               "ovf-ui/assets/ovfWizardManager/blockUIService.js",
               "ovf-ui/assets/ovfWizardManager/xmlUtilService.js",
               "ovf-ui/assets/ovfWizardManager/ovfService.js",
               "ovf-ui/assets/ovfWizardManager/progressBarDirective.js",
               "ovf-ui/assets/ovfWizardPages/eulaController.js",
               "ovf-ui/assets/ovfWizardPages/installTypeController.js",
               "ovf-ui/assets/ovfWizardPages/applianceSetupController.js",
               "ovf-ui/assets/ovfWizardPages/migrationController.js",
               "ovf-ui/assets/ovfWizardPages/infrastructureController.js",
               "ovf-ui/assets/ovfWizardPages/sizingController.js",
               "ovf-ui/assets/ovfWizardPages/datastoresController.js",
               "ovf-ui/assets/ovfWizardPages/configureSsoController.js",
               "ovf-ui/assets/ovfWizardPages/connectToSSOController.js",
               "ovf-ui/assets/ovfWizardPages/networksController.js",
               "ovf-ui/assets/ovfWizardPages/databasesController.js",
               'ovf-ui/assets/ovfWizardPages/summaryController.js',
               "ovf-ui/assets/ovfWizardPages/progressController.js"
         ];
         for (i in scriptsArray) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = scriptsArray[i];
            head.appendChild(script);
         }
         var template = '<div id="ovfWizardWrapper" ng-controller="WizardWrapperController"'+
               ' class="base-app-styles">'+
               '<div id="ovfWizard" ng-controller="OvfDeployController" ng-if="showWizard">'+
               '<div ng-include="\'ovf-ui/assets/ovfWizardManager/wizardSkeleton.html\'">'+
               '</div></div></div>';
         vcsaLogger.info("Appended js, css files to the dom");
         // Append Divs for wizard.
         // Bootstrap Angular Manually to parse the new divs.
         setTimeout(function () {
            $('body').append(template);
            angular.bootstrap($('#ovfWizardWrapper'), ["myApp"]);
            vcsaLogger.info("Bootstrapped the wizard app");
         }, 3000);
      })
   }
}