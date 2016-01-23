(function(angular) {
  'use strict';

  angular.module('confApp.status')
    .directive('loading', function() {
      return {
        restrict: 'E',
        templateUrl: 'partials/loading.html',
        controller: function(loading) {
          this.loading = loading;
        },
        controllerAs: 'ctrlLoading',
        bindToController: true
      };
    });
})(window.angular);