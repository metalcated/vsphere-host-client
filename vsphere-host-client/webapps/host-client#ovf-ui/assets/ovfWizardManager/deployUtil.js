/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * JS file to manage cloudVM deployment.
 * Launches the wizard for ovfdeployment.
 * Handles callbacks from ovftool for various commands.

 */

var DeployUtil = {

   /* Called from flex to launch wizard.
    * @param objectId
    *    moRef of the target on which we are going to deploy.
    * @param pluginId
    *    id of the cip plugin instance created.
    */
   launchDeployCloudVMWizard : function(objectId, pluginId) {
      if (!objectId || !pluginId) {
         // todo @mthirunavukkar show alert. ( decide on UI)
         return;
      }
      $.get("messagebroker/getLocaleMap", function(localeMap){
         angular.element('#ovfWizardWrapper').scope().$apply(function() {
            angular.element('#ovfWizardWrapper').scope().openWizard(objectId,
                  pluginId, localeMap);
         });
      })
   }
};