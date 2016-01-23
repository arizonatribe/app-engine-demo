(function(angular) {
  'use strict';

  angular.module('confApp.conference')
    /**
     * Holds the default values for the input candidates for city select.
     * @ngdoc constant
     * @name confApp.conference.cities
     * @type {string[]}
     */
    .constant('cities', [
      'Chicago',
      'London',
      'Paris',
      'San Francisco',
      'Tokyo'
    ]);
})(window.angular);