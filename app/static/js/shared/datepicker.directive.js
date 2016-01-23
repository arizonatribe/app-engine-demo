(function(angular) {
  'use strict';

  angular.module('confApp.shared')
    .directive('datepicker', function() {
      return {
        restrict: 'E',
        templateUrl: 'partials/datepicker.html',
        controller: 'DatepickerCtrl',
        controllerAs: 'ctrlDatepicker',
        bindToController: true,
        scope: {
          label: '@',
          validationMessage: '@',
          dateField: '=',
          isValid: '&'
        }
      };
    });
})(window.angular);