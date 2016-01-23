(function(angular) {
  'use strict';

  angular.module('confApp.status')
    .constant('HTTP_ERRORS', {
      'UNAUTHORIZED': 401
    });
})(window.angular);