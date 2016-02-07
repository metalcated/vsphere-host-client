/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * EulaController checks if user had accepted the license.
 */
angular.module('myApp').controller('EulaController',
['$scope', '$q',function($scope, $q){
   var wizard = $scope.vxWizard;

   angular.extend(wizard.current, {
      onNext: function(){
         if (wizard.wizardData.acceptEula === "false") {
            wizard.validationBanner.data =
                  [{text: wizard.localeMap["DeployVcsaEulaPage.errorNotAccepted"],
                  type:"critical"}];
            return false;
         }
         var deferredPromise = $q.defer();
         var result = setOvfTarget(wizard.wizardData.ovfVar.pluginId,
               wizard.wizardData.ovfVar.ticket,
               wizard.wizardData.ovfVar.targetHost,
               function(ticket, path){
                  $scope.$apply(function() {
                     deferredPromise.resolve(true);
                  });
               });
         return result == 0 ? deferredPromise.promise : false;
      }
   });

   printPopup = function (data) {
      var mywindow = window.open('',
         wizard.localeMap["DeployVcsaEulaPage.eulaTitle"], 'height=400,width=600');
      mywindow.document.write(
            '<html><head><title>' +
            wizard.localeMap["DeployVcsaEulaPage.eulaTitle"] +
            '</title></head><body>');
      mywindow.document.write(data);
      mywindow.document.write('</body></html>');
      mywindow.print();
      mywindow.close();
      return true;
   }

   $scope.printEula = function () {
      printPopup($('#eulaText').html());
   }
}]);