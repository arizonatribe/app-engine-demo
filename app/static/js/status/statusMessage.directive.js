(function(angular) {
  'use strict';

  angular.module('confApp.status')
    .directive('displayStatusMessage', function() {
      return {
        restrict: 'E',
        templateUrl: 'partials/display_status_message.html',
        controller: function(utils, statusMessage, alertStatus) {
          utils.bindDependenciesToInstance(this, arguments);
        },
        controllerAs: 'ctrlDisplayStatusMessage',
        bindToController: true
      };
    });
})(window.angular);