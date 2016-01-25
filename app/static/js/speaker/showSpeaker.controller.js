(function(angular) {
  'use strict';

  angular.module('confApp.speaker')
    /**
     * A controller used for the Show speakers page.
     * @ngdoc controller
     * @name confApp.speaker.ShowSpeakerCtrl
     * @class
     * @constructor
     */
    .controller('ShowSpeakerCtrl', ShowSpeakerController);

  function ShowSpeakerController(utils, speakerService, paginationService) {
    utils.bindDependenciesToInstance(this, arguments);
    this.speakers = [];
    this.pagination = paginationService(this.speakers);
  }

  angular.extend(ShowSpeakerController.prototype, {
    /**
     * Invokes the conference.getSpeakers API.
     * @method confApp.speaker.ShowSpeakerCtrl#getSpeakers
     */
    getSpeakers:  function() {
      this.speakerService.getSpeakers().then(function(resp) {
        this.speakers = resp;
      }.bind(this));
    }
  });
})(window.angular);
