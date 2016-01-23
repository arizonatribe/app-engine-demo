(function(angular) {
  'use strict';

  angular.module('confApp.api')
    .value('authStatus', {
      signedIn: false
    });
})(window.angular);