(function(angular) {
  'use strict';

  angular.module('confApp.speaker')
    .controller('SpeakerDetailCtrl', SpeakerDetailController);

   /**
    * A controller used for the speaker detail page.
    * @ngdoc controller
    * @name confApp.speaker.SpeakerDetailCtrl
    * @requires confApp.shared.utils
    * @requires $q
    * @requires $location
    * @requires $routeParams
    * @requires confApp.speaker.speakerService
    */
    function SpeakerDetailController(utils, $q, $location, $routeParams, speakerService) {
      utils.bindDependenciesToInstance(this, arguments);
      this.speaker = {};
      this.websafeSpeakerKey = $routeParams.websafeSpeakerKey;
    }

    angular.extend(SpeakerDetailController.prototype, {
      /**
       * Initializes the speaker detail page.
       * Invokes the conference.getSpeaker method and sets the returned speaker to the controller.
       * @method confApp.speaker.SpeakerDetailCtrl#init
       */
      init: function() {
        var getSpeaker = this.speakerService.getSpeaker(this.websafeSpeakerKey).then(function (resp) {
              this.speaker = resp;
            }.bind(this)),
            getFeaturedSpeaker = this.speakerService.getFeaturedSpeaker(this.websafeSpeakerKey).then(function (resp) {
              this.summary = resp;
            }.bind(this));

        this.$q.all([
          getSpeaker,
          getFeaturedSpeaker
        ]);
      },
      /**
       * Invokes the conference.saveSpeaker method.
       * @method confApp.speaker.SpeakerDetailCtrl#saveSpeaker
       */
      saveSpeaker: function() {
        this.speakerService.saveSpeaker(this.websafeSpeakerKey);
      },
      /**
       * Invokes the conference.removeSpeaker method.
       * @method confApp.speaker.SpeakerDetailCtrl#removeSpeaker
       */
      removeSpeaker: function() {
        this.speakerService.removeSpeaker(this.websafeSpeakerKey).then(function() {
          this.$location.path('/speaker');
        }.bind(this));
      }
    });
})(window.angular);