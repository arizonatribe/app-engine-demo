(function(angular) {
  'use strict';

  angular.module('confApp.session')
    /**
     * A controller used for the Show sessions page.
     * @ngdoc controller
     * @name confApp.session.ShowSessionCtrl
     * @class
     * @constructor
     */
    .controller('ShowSessionCtrl', ShowSessionController);

  function ShowSessionController(
    utils, SessionTypes, speakerService, authStatus, sessionService, 
    searchFilterService, oauth2Provider, $routeParams, paginationService
  ) {
    utils.bindDependenciesToInstance(this, arguments);
    this.sessions = [];
    this.speakers = [];
    speakerService.getSpeakers().then(function(resp) {
      this.speakers = resp;
    }.bind(this));
    this.selectedTab = 'ALL';
    this.isOffcanvasEnabled = false;
    this.searchFilter = searchFilterService({
      TYPE: 'Type',
      SPEAKER: 'Speaker',
      EARLY: 'Early Non-Workshops'
    });
    this.pagination = paginationService(this.sessions);
  }

  angular.extend(ShowSessionController.prototype, {
    /**
     * Sets the selected tab to 'ALL'
     * @method confApp.session.ShowSessionCtrl#tabAllSelected
     */
    tabAllSelected:  function() {
      this.selectedTab = 'ALL';
      this.querySessions();
    },
    /**
     * Sets the selected tab to 'YOU_WISH'
     * @method confApp.session.ShowSessionCtrl#tabYouWishSelected
     */
    tabYouWishSelected: function() {
      this.selectedTab = 'YOU_WISH';
      if (!this.authStatus.signedIn) {
        this.oauth2Provider.showLoginModal();
        return;
      }
      this.querySessions();
    },
    /**
     * Toggles the status of the offcanvas.
     * @method confApp.session.ShowSessionCtrl#toggleOffcanvas
     */
    toggleOffcanvas: function () {
      this.isOffcanvasEnabled = !this.isOffcanvasEnabled;
    },
    /**
     * Query the conferences depending on the tab currently selected.
     * @method confApp.session.ShowSessionCtrl#querySessions
     */
    querySessions: function() {
      if (this.selectedTab == 'ALL') {
        this.getSessions();
      } else if (this.selectedTab == 'YOU_WISH') {
        this.getSessionsInWishlist();
      }
    },
    /**
     * Invokes the conference.queryConferences API.
     * @method confApp.session.ShowSessionCtrl#getSessions
     */
    getSessions:  function() {
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
            this.searchFilter.filters[0].value,
            this.$routeParams.websafeConferenceKey
          ).then(function(resp) {
            this.sessions = resp;
          }.bind(this));
        }
      } else {
        this.searchFilter.clearFilters();
      }
    },
    /**
     * Retrieves the sessions in your wishlist.
     * @method confApp.session.ShowSessionCtrl#getSessionsInWishlist
     */
    getSessionsInWishlist:  function() {
      this.sessionService.getSessionsInWishlist().then(function(resp) {
        this.sessions = resp;
      }.bind(this));
    }
  });
})(window.angular);
