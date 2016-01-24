(function(angular) {
  'use strict';
  
  angular.module('confApp.shared')
    .factory('searchFilter', SearchFilterService);

  function SearchFilterService(searchFilterOperators) {
    return function(filterFields) {
      var filtereableFields = [],
          svc = {};
          
      /**
       * The filtereable fields are specific to this instance of the `searchFilter`
       * and so they are passed in as either [{key: value}, {key: value}...] OR
       * as {key1: value1, key2: value2, key3: value3...} and are coerced into
       * the format {enumValue: key, displayName: val} and placed into `filterableFields`
       */ 
      if (filterFields) {
        angular.forEach(filterFields, function(val, key) {
          if (val && key) {
            filtereableFields.push({
              enumValue: key.toUpperCase(),
              displayName: val
            });
          }
        });
      }

      svc = {
        /**
         * Holds the filters that will be applied when the query is invoked.
         * @type {Array}
         */
        filters: [],
        /**
         * Removes the filter specified by the index from $scope.filters.
         *
         * @param index
         */
        removeFilter: function (index) {
          if (svc.filters[index]) {
            svc.filters.splice(index, 1);
          }
        },
        /**
         * Clears all filters.
         */
        clearFilters: function () {
          svc.filters = [];
        },
        /**
         * Removes all filters except for a specified filter(s)
         * @param {string|array} keys
         */
        removeAllFiltersExcept: function(keys) {
          if (angular.isString(keys) || angular.isArray(keys)) {
            svc.filters = svc.filters.filter(function(fil) {
              return angular.isString(keys) ?
                fil.enumValue === keys.toUpperCase() :
                angular.isArray(keys) ?
                keys.indexOf(fil.enumValue) >= 0 : true;
            });
          }
        },
        /**
         * Adds a filter and set the default value.
         */
        addFilter: function (field, val) {
          if (angular.isString(field)) {
            svc.filtereableFields.forEach(function(fil) {
              if (fil.enumValue === field.toUpperCase()) {
                svc.filters.push({
                  field: fil.enumValue,
                  operator: searchFilterOperators[0],
                  value: val || ''
                });
              }
            });
          } else {
            svc.filters.push({
              field: filtereableFields[0],
              operator: searchFilterOperators[0],
              value: ''
            });
          }
        }
      };
    };
  }
})(window.angular);