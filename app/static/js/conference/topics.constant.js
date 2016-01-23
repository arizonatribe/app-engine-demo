(function(angular) {
  'use strict';

  angular.module('confApp.conference')
    /**
     * Holds the default values for the input candidates for topics select.
     * @ngdoc constant
     * @name confApp.conference.topics
     * @type {string[]}
     */
    .constant('topics', [
      'Medical Innovations',
      'Programming Languages',
      'Web Technologies',
      'Movie Making',
      'Health and Nutrition'
    ]);
})(window.angular);

