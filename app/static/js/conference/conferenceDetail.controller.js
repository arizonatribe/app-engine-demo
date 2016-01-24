(function(angular) {
  'use strict';
  
  angular.module('confApp.conference')
    /**
     * A controller used for the conference detail page.
     * @ngdoc controller
     * @name confApp.conference.ConferenceDetailCtrl
     * @class
     * @constructor
     * @requires confApp.shared.utils
     * @requires $q
     * @requires confApp.conference.conferenceService
     * @requires confApp.profile.profileService
     * @requires confApp.speaker.speakerService
     * @requires confApp.session.sessionService
     * @requires confApp.conference.registrationService
     * @requires confApp.shared.searchFilterService
     * @requires confApp.shared.paginationService
     * @requires $location
     * @requires $routeParams
     * @requires confApp.session.SessionTypes
     */
    .controller('ConferenceDetailCtrl', ConferenceDetailController);
  
  function ConferenceDetailController(
    utils, $q, conferenceService, profileService, speakerService,
    sessionService, registrationService, searchFilterService, paginationService, 
    $location, $routeParams, SessionTypes
  ) {
    utils.bindDependenciesToInstance(this, arguments);
    this.isUserAttending = false;
    
    this.sessions = [];
    this.conference = {};
    
    this.pagination = paginationService(this.sessions);
    this.searchFilter = searchFilterService({
      TYPE: 'Type',
      SPEAKER: 'Speaker',
      EARLY: 'Early Non-Workshops'
    });
  }
  
  angular.extend(ConferenceDetailController.prototype, {
    /**
     * Clears filter.
     * @method confApp.conference.ConferenceDetailCtrl#clearFilters
     */
    clearFilters: function () {
      this.searchFilter.clearFilters();
      this.sessionService.getAllSessions().then(function(res) {
        this.sessions = res;
      }.bind(this));        
    },   
    /**
     * Initializes the conference detail page.
     * Invokes the conference.getConference method and sets the returned conference in the $scope.
     * @method confApp.conference.ConferenceDetailCtrl#init
     */
    init: function () {
      var getConference = this.conferenceService.getConference(
            this.$routeParams.websafeConferenceKey
          ).then(function(resp) {
            this.conference = resp;
          }.bind(this)),
          getProfile = this.profileService.getProfile().then(function(resp) {
            if (resp.conferenceKeysToAttend) {
              this.isUserAttending = resp.conferenceKeysToAttend.any(function(key) {
                return this.$routeParams.websafeConferenceKey === key;
              });
            }
          }.bind(this)),
          getConferenceSessions = this.sessionService.getConferenceSessions(
            this.$routeParams.websafeConferenceKey 
          ).then(function(resp) {
            this.sessions = resp;
          }.bind(this)),
          getConferenceSpeakers = this.speakerService.getConferenceSpeakers(
            this.$routeParams.websafeConferenceKey 
          ).then(function(resp) {
            this.speakers = resp;
          }.bind(this));
        
      this.$q.all([
        getConference,
        getProfile,
        getConferenceSessions,
        getConferenceSpeakers
      ]);
    },
    /**
     * Invokes the conference.registerForConference method.
     * @method confApp.conference.ConferenceDetailCtrl#registerForConference
     */
    registerForConference: function () {
      this.registrationService.register(this.$routeParams.websafeConferenceKey).then(function() {
        this.isUserAttending = true;
        this.conference.seatsAvailable = this.conference.seatsAvailable + 1;
      }.bind(this));
    },
    /**
     * Invokes the conference.unregisterForConference method.
     * @method confApp.conference.ConferenceDetailCtrl#unregisterFromConference
     */
    unregisterFromConference: function () {
      this.registrationService.unregister(
        this.$routeParams.websafeConferenceKey
      ).then(function() {
        this.conference.seatsAvailable = this.conference.seatsAvailable + 1;
        this.isUserAttending = false;
      }.bind(this));
    },
    /**
     * Invokes the conference.removeConference method.
     * @method confApp.conference.ConferenceDetailCtrl#removeConference
     */
    removeConference: function () {
      this.conferenceService.deleteConference(
        this.$routeParams.websafeConferenceKey
      ).then(function(){
        this.$location.path('/conference');
      }.bind(this));
    },
    /**
     * Retrieve a filtered set of conference sessions (by speaker, type or early non-workshops)
     * @method confApp.conference.ConferenceDetailCtrl#querySessions
     */
    querySessions: function () {
      if (this.searchFilter.filters[0].field) {
        if (this.searchFilter.filters[0].field === 'SPEAKER') {
          this.sessionService.getSessionsBySpeaker(
            this.searchFilter.filters[0].value
          ).then(function(resp) {
            this.sessions = resp;
          }.bind(this));
        } else if (this.searchFilter.filters[0].field === 'EARLY') {
          this.sessionService.getDaytimeNonWorkshopSessions().then(function(resp) {
            this.sessions = resp;
          }.bind(this));
        } else {
          this.sessionService.getAllSessionsByType(
            this.searchFilter.filters[0].value, this.$routeParams.websafeConferenceKey
          ).then(function(resp) {
            this.sessions = resp;
          }.bind(this));
        }
      } else {
        this.clearFilters();
      }
    }
  });

})(window.angular);