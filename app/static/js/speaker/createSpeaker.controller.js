(function(angular) {
  'use strict';

  angular.module('confApp.speaker')
    .controller('CreateSpeakerCtrl', CreateSpeakerController);

  /**
   * A controller used for the Create speaker page.
   * @ngdoc controller
   * @name confApp.speakers.CreateSpeakerCtrl
   * @requires utils
   * @requires $location
   * @requires speakerService
   */
  function CreateSpeakerController(utils, $location, speakerService) {
    utils.bindDependenciesToInstance(this, arguments);
    /**
     * The speaker object being edited in the page.
     * @type {{}|*}
     */
    this.speaker = this.speaker || {};
  }

  /**
   * Invokes the conference.createSpeaker API.
   * @method confApp.conference#createSpeaker
   * @param {object} speakerForm the form object.
   */
  CreateSpeakerController.prototype.createSpeaker = function (speakerForm) {
    speakerService(speakerForm).then(function() {
      this.speaker = {};
      this.$location.path('/speaker');
    }.bind(this));
  };
})(window.angular);
