(function(angular) {
  'use strict';

  angular.module('confApp.conference')
    .controller('CreateConferenceCtrl', CreateConferenceController);

  /**
   * A controller used for the Create conferences page.
   * @ngdoc controller
   * @name confApp.conference.CreateConferenceCtrl
   * @class
   * @constructor
   * @requires confApp.shared.utils
   * @requires confApp.conference.cities
   * @requires confApp.conference.topics
   * @requires $location
   * @requires confApp.conference.conferenceService
   * @requires confApp.status.loading
   */
  function CreateConferenceController(utils, cities, topics, $location, conferenceService, loading) {
    utils.bindDependenciesToInstance(this, arguments);
    this.conference = {};
  }

  angular.extend(CreateConferenceController.prototype, {
    /**
     * Tests if the argument is an integer and not negative.
     * @returns {boolean} true if the argument is an integer, false otherwise.
     */
    isValidMaxAttendees: function () {
      if (!this.conference.maxAttendees || this.conference.maxAttendees.length === 0) {
        return true;
      }
      return /^[\d]+$/.test(this.conference.maxAttendees) && this.conference.maxAttendees >= 0;
    },

    /**
     * Tests if the conference.startDate and conference.endDate are valid.
     * @returns {boolean} true if the dates are valid, false otherwise.
     */
    isValidDates: function () {
      if (!this.conference.startDate && !this.conference.endDate) {
        return true;
      }
      if (this.conference.startDate && !this.conference.endDate) {
        return true;
      }
      return this.conference.startDate <= this.conference.endDate;
    },

    /**
     * Tests if $scope.conference is valid.
     * @param conferenceForm the form object from the create_conferences.html page.
     * @returns {boolean|*} true if valid, false otherwise.
     */
    isValidConference: function(conferenceForm) {
      return !conferenceForm.$invalid &&
        this.isValidMaxAttendees() &&
        this.isValidDates();
    },

    /**
     * Invokes the conference.createConference API.
     *
     * @param conferenceForm the form object.
     */
    createConference: function(conferenceForm) {
      if (!this.isValidConference(conferenceForm)) {
        return;
      }

      this.conferenceService.createConference(
        this.conference
      ).then(function() {
        this.conference = {};
        this.$location.path('/conference');
      }.bind(this));
    }
  });
})(window.angular);