(function(angular) {
  'use strict';

  angular.module('confApp.conference')
    .constant('SessionTypes', [
      'UNKNOWN',
      'WORKSHOP',
      'LECTURE',
      'KEYNOTE',
      'MEETUP'
    ]);
})(window.angular);