/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

/**
 * Progress bar directive.
 * Usage - specify width, height, percent as follows
 * <div determinate bar-width="680px" bar-height="23px"
 *      progress-percent="{{progressPercent}}"></div>
 */
angular.module('myApp').directive('determinate', function(){
   return {
      restrict: 'A',
      scope: { width:'@barWidth', height:'@barHeight',
            percent:'@progressPercent' },
      template: '<div class="progress" ng-style="getProgressBarStyle()">' +
            '<div class="bar" ng-style="getPercentStyle()"></div></div>',
      controller: function($scope) {
         // To trim "%" if present and return style.
         $scope.getPercentStyle = function() {
            var percent = $scope.percent.replace("%","");
            style = { width: percent + "%"};
            return style;
         }

         $scope.getProgressBarStyle = function() {
            style = {
                  width: $scope.width,
                  height: $scope.height,
                  borderColor: '#c7c7c7'
            };
            return style;
         }
      }
   }
});

