(function(angular) {
  'use strict';

  angular.module('confApp.shared')
    .controller('DatepickerCtrl', DatePickerController);

  /**
   * A controller that holds properties for a datepicker.
   * @ngdoc controller
   * @name confApp.shared.DatepickerCtrl
   * @class
   * @constructor
   */
  function DatePickerController() {
    this.dateOptions = {
      'year-format': "'yy'",
      'starting-day': 1
    };

    this.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'shortDate'];
    this.format = this.formats[0];
    this.minDate = new Date();
    this.dt = new Date();
  }

  angular.extend(DatePickerController.prototype, {
    /**
     * Use the custom validation passed into this directive controller's isolate scope,
     * but if there isn't one, just make sure it's a date in the future.
     * @method confApp.shared.DatepickerCtrl#isValidDate
     * @returns {boolean}
     */
    isValidDate: function() {
      if (angular.isFunction(this.isValid)) {
        return this.isValid();
      } else {
        this.validationMessage = this.label + ' must be a future date';
        return angular.isDate(this.dateField) && this.dateField >= (new Date());
      }
    },
    today: function() {
      this.dt = new Date();
    },
    clear: function() {
      this.dt = null;
    },
    /**
     * Disable weekend selection
     */
    disabled: function(date, mode) {
      return (mode === 'day' && (date.getDay() === 0 || date.getDay() === 6 ));
    },
    toggleMin: function() {
      this.minDate = this.minDate ? null : new Date();
    },
    open: function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      this.opened = true;
    }
  });
})(window.angular);