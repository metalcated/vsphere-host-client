/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/*
 * Common service to trigger 3rd party BlockUI jquery lib for
 * progress indeterminate.
 * TODO mthirunavukkar fix styles and add ways to pass custom messages
 * and set timeout just to be safe (check flex code).
 * Can be injected into other controllers using dependency injection.
 */
myApp.factory('blocker', function() {
   return {
      blockUI : function() {
         $.blockUI({
            message : $('#wizardBlockUIMessage'),
            baseZ : 1100,
            css : {  left : '45%', border: '1px solid #aaa', width : '20%'}
         });
      },
      unBlockUI : function() {
         $.unblockUI();
      }
   }
});