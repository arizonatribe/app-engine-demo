(function(angular) {
  'use strict';

  angular.module('confApp.conference')
  /**
   * A controller used for the Show conferences page.
   * @ngdoc controller
   * @name confApp.conference.ShowConferenceCtrl
   * @class
   * @constructor
   */
  .controller('ShowConferenceCtrl', ShowConferenceController);

  function ShowConferenceController(utils, conferenceService, authStatus, searchFilterService, oauth2Provider, paginationService) {
    utils.bindDependenciesToInstance(this, arguments);
    this.conferences = [];
    this.selectedTab = 'ALL';
    this.isOffcanvasEnabled = false;
    this.searchFilter = searchFilterService({
      'CITY': 'City',
      'TOPIC': 'Topic',
      'MONTH': 'Start month',
      'MAX_ATTENDEES': 'Max Attendees'
    });
    this.pagination = paginationService(this.conferences);
  }

  angular.extend(ShowConferenceController.prototype, {
    /**
     * Sets the selected tab to 'ALL'
     * @method confApp.conference.ShowConferenceCtrl#tabAllSelected
     */
    tabAllSelected:  function() {
      this.selectedTab = 'ALL';
      this.queryConferences();
    },
    /**
     * Sets the selected tab to 'YOU_HAVE_CREATED'
     * @method confApp.conference.ShowConferenceCtrl#tabYouHaveCreatedSelected
     */
    tabYouHaveCreatedSelected: function() {
      this.selectedTab = 'YOU_HAVE_CREATED';
      if (!this.authStatus.signedIn) {
        this.oauth2Provider.showLoginModal();
        return;
      }
      this.queryConferences();
    },
    /**
     * Sets the selected tab to 'YOU_WILL_ATTEND'
     * @method confApp.conference.ShowConferenceCtrl#tabYouWillAttendSelected
     */
    tabYouWillAttendSelected: function() {
      this.selectedTab = 'YOU_WILL_ATTEND';
      if (!this.authStatus.signedIn) {
        this.oauth2Provider.showLoginModal();
        return;
      }
      this.queryConferences();
    },

    /**
     * Toggles the status of the offcanvas.
     * @method confApp.conference.ShowConferenceCtrl#toggleOffcanvas
     */
    toggleOffcanvas: function () {
      this.isOffcanvasEnabled = !this.isOffcanvasEnabled;
    },
    /**
     * Query the conferences depending on the tab currently selected.
     * @method confApp.conference.ShowConferenceCtrl#queryConferences
     */
    queryConferences: function() {
      if (this.selectedTab == 'ALL') {
        this.queryConferencesAll();
      } else if (this.selectedTab == 'YOU_HAVE_CREATED') {
        this.getConferencesCreated();
      } else if (this.selectedTab == 'YOU_WILL_ATTEND') {
        this.getConferencesAttend();
      }
    },
    /**
     * Invokes the conference.queryConferences API.
     * @method confApp.conference.ShowConferenceCtrl#queryConferencesAll
     */
    queryConferencesAll:  function() {
      this.conferenceService.queryConferences(
        this.searchFilter.filters.filter(function(fil) {
          return fil.field && fil.operator && fil.value;
        }).map(function(fil) {
          return {
            field: fil.field.enumValue,
            operator: fil.operator.enumValue,
            value: fil.value
          };
        })
      ).then(function(resp) {
        this.conferences = resp;
      }.bind(this));
    },
    /**
     * Invokes the conference.getConferencesCreated method.
     * @method confApp.conference.ShowConferenceCtrl#getConferencesCreated
     */
    getConferencesCreated:  function() {
      this.conferenceService.getConferencesCreated().then(function(resp) {
        this.conferences = resp;
      }.bind(this));
    },
    /**
     * Retrieves the conferences to attend by calling the conference.getProfile method and
     * invokes the conference.getConference method n times where n == the number of the conferences to attend.
     * @method confApp.conference.ShowConferenceCtrl#getConferencesAttend
     */
    getConferencesAttend: function () {
      this.conferenceService.getConferencesToAttend().then(function(resp) {
        this.conferences = resp;
      }.bind(this));
    }
  });
})(window.angular);
