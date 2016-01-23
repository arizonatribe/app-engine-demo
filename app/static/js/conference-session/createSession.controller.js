(function(angular) {
  'use strict';

  angular.module('confApp.session')
    .controller('CreateSessionCtrl', CreateSessionController);

  /**
   * A controller used for the Create conference sessions page.
   * @ngdoc controller
   * @name confApp.session.CreateSessionCtrl
   * @class
   * @constructor
   * @requires confApp.shared.utils
   * @requires $location
   * @requires confApp.speaker.speakerService
   * @requires confApp.session.sessionService
   * @requires $routeParams
   * @requires confApp.session.SessionTypes
   */
  function CreateSessionController(utils, $location, speakerService, sessionService, $routeParams, SessionTypes) {
    utils.bindDependenciesToInstance(this, arguments);
    /**
     * The session object being edited in the page.
     * @type {{}|*}
     */
    this.session = this.session || {};
    this.session.websafeConferenceKey = $routeParams.websafeConferenceKey;
    this.speakers = [];

    speakerService.getSpeakers().then(function(resp) {
      this.speakers = resp.speakers;
    }.bind(this));
  }

  angular.extend(CreateSessionController.prototype, {
    /**
     * Tests if the arugment is an integer and not negative and not greater than 4 hours.
     * @method confApp.session.CreateSessionCtrl#isValidMaxDuration
     * @returns {boolean} true if the argument is a positive integer less than 240 (mins), false otherwise.
     */
    isValidMaxDuration: function() {
      if (!this.session.duration) {
        return true;
      }
      return /^[\d]+$/.test(this.session.duration) && this.session.duration >= 15 && this.session.duration <= 240;
    },
    /**
     * Tests if the session.date is in the future
     * @method confApp.session.CreateSessionCtrl#isValidDate
     * @returns {boolean} true if the date is in the future, false otherwise.
     */
    isValidDate: function() {
      if (!this.session.date) {
        return true;
      }
      return this.session.date >= new Date();
    },
    /**
     * Tests if $scope.session is valid.
     * @method  confApp.session.CreateSessionCtrl#isValidSession
     * @param sessionForm the form object from the create_session.html page.
     * @returns {boolean|*} true if valid, false otherwise.
     */
    isValidSession: function(sessionForm) {
      return !sessionForm.$invalid &&
        this.isValidMaxDuration() &&
        this.isValidDate();
    },
    /**
     * Invokes the session.createSession API.
     * @method confApp.session.CreateSessionCtrl#createSession
     * @param sessionForm the form object.
     */
    createSession: function(sessionForm) {
      if (!this.isValidSession(sessionForm)) {
        return;
      }

      sessionService.createConferenceSession(this.session).then(function() {
        this.session = {};
        this.$location.path('/conference/detail/' + this.session.websafeConferenceKey);
      }.bind(this));
    }
  });
})(window.angular);