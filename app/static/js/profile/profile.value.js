(function(angular) {
  'use strict';

  angular.module('confApp.profile')
    .value('profile', {
      value: { },
      clear: function() {
        this.value = {};
      },
      set: function(prof) {
        if (prof) {
          this.value.initialProfile = prof;
          this.value.displayName = prof.displayName;
          this.value.teeShirtSize = prof.teeShirtSize;
        } else {
          this.clear();
        }
      }
    });
})(window.angular);