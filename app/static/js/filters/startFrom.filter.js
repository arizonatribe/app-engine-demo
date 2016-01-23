(function(angular) {
  'use strict';

  /**
   * @ngdoc filter
   * @name confApp.filters.startFrom
   *
   * @description
   * A filter that extracts an array from the specific index.
   *
   */
  angular.module('confApp.filters')
    .filter('startFrom', function () {
      /**
       * Extracts an array from the specific index.
       *
       * @param {Array} data
       * @param {Integer} start
       * @returns {Array|*}
       */
      return function(data, start) {
        return data.slice(start);
      };
    });
})(window.angular);