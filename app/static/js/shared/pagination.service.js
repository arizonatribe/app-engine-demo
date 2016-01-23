(function(angular) {
  'use strict';

  angular.module('confApp.shared')
    .factory('paginationService', PaginationService);

  function PaginationService() {
    /**
     * Service handles paging through a collection of items.
     * @name confApp.shared.paginationService
     * @param {object[]} items An array of items to paginate
     * @class
     * @constructor
     * @type {object}
     */
    return function(items) {
      return {
        currentPage: 0,
        pageSize: 20,
        /**
         * Returns the number of the pages in the pagination.
         * @method confApp.shared.paginationService#numberOfPages
         * @returns {number}
         */
        numberOfPages: function() {
          return Math.ceil(items.length / this.pagination.pageSize);
        },
        /**
         * Returns an array including the numbers from 1 to the number of the pages.
         * @method confApp.shared.paginationService#pageArray
         * @returns {Array}
         */
        pageArray: function() {
          var pages = [];
          var numberOfPages = this.numberOfPages();
          for (var i = 0; i < numberOfPages; i++) {
            pages.push(i);
          }
          return pages;
        },
        /**
         * Checks if the target element that invokes the click event has the "disabled" class.
         * @method confApp.shared.paginationService#isDisabled
         * @param event the click event
         * @returns {boolean} if the target element that has been clicked has the "disabled" class.
         */
        isDisabled: function(event) {
          return angular.element(event.target).hasClass('disabled');
        }
      }
    };
  }

})(window.angular);