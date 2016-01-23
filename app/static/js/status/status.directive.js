(function(angular) {
  'use strict';

  angular.module('confApp.status')
    .directive('displayStatusMessage', function() {
      return {
        restrict: 'E',
        templateUrl: 'partials/status.html'
      };
    });
})(window.angular);