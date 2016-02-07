/* Copyright 2013 VMware, Inc. All rights reserved. -- VMware Confidential */

// Helper functions
// TODO @mthirunavukkar add to common util
function isEmpty(value) {
  return angular.isUndefined(value) || value === '' || value === null || value !== value;
}
// Custom Directive to validate password match.
// Matches password and confirm password field.
// Behaves like custom validator directives.
// From will be dirty unless the condition is met so no additional text.
angular.module('myApp').directive('vxPasswordMatch', function () {
   return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
         var firstPassword = '#' + attrs.vxPasswordMatch;
         elem.bind('keyup focusout', function () {
            scope.$apply(function () {
               var validity = elem.val() === $(firstPassword).val();
               ctrl.$setValidity('passwordMatch', validity);
            });
         });
         elem.add(firstPassword).on('keyup focusout', function () {
            scope.$apply(function () {
               var validity = elem.val() === $(firstPassword).val();
               ctrl.$setValidity('passwordMatch', validity);
            });
         });

      }
   }
});

// Custom directive to check if input string is already present in the
// given array. Invalid if present.
// Custom directive to check if input string is already present in the
// given array. Invalid if present.
angular.module('myApp').directive('vxInArray', function () {
   return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {

         var validator = function (value) {
            validity = $.inArray(value, scope[attrs.vxInArray]) === -1;
            ctrl.$setValidity('inArray', validity);
            return value;
         }

         ctrl.$formatters.push(validator);
         ctrl.$parsers.unshift(validator);

         attrs.$observe('inArray', function() {
            validator(ctrl.$viewValue);
         });
      }
   }
});

/* Custom directive to check if input passwords
 * has sufficitent complexity.
 * Must be at least 8 characters
 * Cannot contain spaces
 * Contain both lowercase and UPPERCASE characters
 * Contain at least one numeric digit
 * Contain at least one special character (i.e. any character not 0-9,a-z,A-Z)
 */
angular.module('myApp').directive('vxPasswordComplexity', function () {
   return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
         var passwordRegex = /^\S*(?=\S{8,})(?=\S*[a-z])(?=\S*[A-Z])(?=\S*[\d])(?=\S*[\W])\S*$/;
         elem.bind('blur keyup change focusout', function () {
            scope.$apply(function () {
               var validity;
               if (elem.val() === "") {
                  validity = true;
               } else {
                  validity = elem.val().match(passwordRegex) !== null;
               }
               ctrl.$setValidity('passwordComplexity', validity);
            });
        });
      }
   }
});

/* Custom directive to check if ip is valid
 * Requires ip family to validate
 */
angular.module('myApp').directive('vxValidIp', function () {
   return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
         var validator = function(value) {
            var validity;
            if (isEmpty(value)) {
               validity = true;
            } else {
               var ipFamily = scope[attrs.vxValidIp];
               if (ipFamily === null || typeof ipFamily === 'undefined') {
                  // check against both IPv4 and IPv6 if ipFamily is not specified
                  validity = IpUtil.isIpv4(value) || IpUtil.isIpv6(value);
               } else {
                  var isIp = ipFamily === "ipv4" ? IpUtil.isIpv4 : IpUtil.isIpv6;
                  validity = isIp(value);
               }
            }
            ctrl.$setValidity('isIp', validity);
            return value;
         };
         ctrl.$formatters.push(validator);
         ctrl.$parsers.unshift(validator);

         attrs.$observe('inArray', function() {
            validator(ctrl.$viewValue);
         });
      }
   }
});

/* Custom directive to check if the port number entered is valid
 */
angular.module('myApp').directive('vxPortNumberValid', function () {
   return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
         elem.bind('blur keyup change focusout', function () {
            scope.$apply(function () {
               var validity;
               var val = elem.val();
               if (val === "") {
                  validity = true;
               } else {
                  var portNumber = parseInt(val);
                  validity = !(isNaN(portNumber) || portNumber < 1 || portNumber > 65535);
               }
               ctrl.$setValidity('portNumberValid', validity);
            });
        });
      }
   }
});


/* Custom directive to check if port is available
 */
angular.module('myApp').directive('vxPortAvailable', function () {
   return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
         var portData = scope.portData,
             internalPorts = scope.internalPorts;
         if (typeof portData === 'undefined') {
            return;
         }
         elem.bind('blur keyup change focusout', function () {
            scope.$apply(function () {
               var validity = true;
               var val = elem.val();
               if (val === "") {
                  validity = true;
               } else {
                  // Check if the value conflicts with any of the ports
                  // that has been entered
                  for (i in portData) {
                     if (i === ctrl.$name) {
                        continue;
                     }
                     if (portData[i] === val) {
                        // Compare string values
                        validity = false;
                     }
                  }

                  validity = validity &&
                        ($.inArray(val, internalPorts) == -1);
               }
               ctrl.$setValidity('portAvailable', validity);
            });
        });
      }
   }
});

/* Custom directive to check domain name format
 * eg) something@local and something.local
 */
angular.module('myApp').directive('vxDomainFormat', function () {
   return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
         var domainRegex = /^([A-Za-z0-9-]+(?:[\.])[A-Za-z0-9-]+)+$/;
         elem.bind('blur keyup change focusout', function () {
            scope.$apply(function () {
               var validity;
               if (elem.val() === "") {
                  validity = true;
               } else {
                  validity = elem.val().match(domainRegex) !== null;
               }
               ctrl.$setValidity('domainFormat', validity);
            });
        });
      }
   }
});

/* Custom directive to check SSO site name format
 * eg) special characters ! @ # $ % ^ " are not allowed
 */
angular.module('myApp').directive('vxSiteFormat', function () {
   return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
         var domainRegex = /^([A-Za-z0-9][^!@#$%^"]+)$/;
         elem.bind('blur keyup change focusout', function () {
            scope.$apply(function () {
               var validity;
               if (elem.val() === "") {
                  validity = true;
               } else {
                  validity = elem.val().match(domainRegex) !== null;
               }
               ctrl.$setValidity('siteFormat', validity);
            });
        });
      }
   }
});

// /*
//  * Tooltip directive - initializes bootstrap's tooltip
//  */
// angular.module('myApp').directive('toolTip', function () {
//    return {
//       link: function (scope, elem, attrs, ctrl) {
//            if (attrs.tooltipTitle) {
//             elem.tooltip({title: scope[attrs.tooltipTitle]});
//          } else {
//              elem.tooltip();
//          }
//       }
//    }
// });
