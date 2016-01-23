(function(angular) {
  'use strict';

  angular.module('confApp.status')
    .value('loading', false)
    .value('submitted', false)
    .value('alertStatus', '')
    .value('statusMessage', '');
})(window.angular);