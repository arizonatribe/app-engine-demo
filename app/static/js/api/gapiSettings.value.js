(function(angular) {
  'use strict';

  angular.module('confApp.api')
    .constant('gapiSettings', {
      clientid: '860836366947-mlvo10kihl013im6sah3dm4rc1b7mp95.apps.googleusercontent.com',
      scope: 'email profile',
      cookiepolicy: 'single_host_origin',
      accesstype: 'online',
      approveprompt: 'auto'
    });
})(window.angular);