(function(angular) {
  'use strict';

  angular.module('confApp.conference')
    .directive('createConferenceForm', function() {
      return {
        restrict: 'E',
        templateUrl: 'partials/create-conference.html',
        controller: 'CreateConferenceCtrl',
        controllerAs: 'ctrlCreateConference',
        bindToController: true
      };
    });
})(window.angular);