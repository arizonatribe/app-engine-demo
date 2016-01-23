(function(angular) {
  'use strict';

  angular.module('confApp.profile')
    .directive('profileForm', function() {
      return {
        restrict: 'E',
        templateUrl: 'partials/profile.html',
        controller: 'MyProfileCtrl',
        controllerAs: 'ctrlMyProfile',
        bindToController: true
      };
    });
})(window.angular);