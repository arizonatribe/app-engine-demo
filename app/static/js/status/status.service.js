(function(angular) {
  'use strict';

  angular.module('confApp.status')
    .factory('statusService', StatusService);

  function StatusService($timeout, $log, alertStatus, statusMessage, oauth2Provider, HTTP_ERRORS) {
    var clearAfter = function(ms) {
           $timeout(function() {
            alertStatus = '';
            statusMessage = '';
          }, ~~ms || 5000);
        },
        handle = function(message, obj) {
          if (alertStatus === 'warning') {
            $log.error(statusMessage, obj);
          } else if (alertStatus === 'success') {
            $log.info(statusMessage, obj);
          }

          clearAfter();

          return statusMessage;
        },
        handleUnauthorized = function(code) {
          if (code === HTTP_ERRORS.UNAUTHORIZED) {
            oauth2Provider.showLoginModal();
            return 'Unauthorized. Please login';
          }
        },
        handleSuccess = function(message, obj) {
          alertStatus = 'success';

          statusMessage = message;

          return handle(statusMessage, obj);
        },
        handleError = function(err, action, obj) {
          alertStatus = 'warning';

          statusMessage = 'Failed to ' + action;
          if (err && err.message) statusMessage = ': '+ err.message;

          return handle(statusMessage, obj);
        };

    return {
      clearAfter: clearAfter,
      handleError: handleError,
      handleSuccess: handleSuccess,
      handleUnauthorized: handleUnauthorized
    };
  }
})(window.angular);