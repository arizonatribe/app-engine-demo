(function(angular) {
  'use strict';

  angular.module('confApp.profile')
    .controller('MyProfileCtrl', MyProfileController);

  /**
   * A controller used for the My Profile page.
   * @ngdoc controller
   * @name confApp.MyProfileCtrl
   * @class
   * @constructor
   * @requires $location
   * @requires confApp.shared.utils
   * @requires confApp.api.authStatus
   * @requires confApp.profile.profile
   * @requires confApp.status.submitted
   * @requires confApp.profile.TeeShirtSize
   * @requires confApp.profile.profileService
   * @requires confApp.status.loading
   * @requires confApp.api.oauth2Provider
   */
  function MyProfileController(utils, authStatus, profile, submitted, TeeShirtSize, $location, profileService, loading, oauth2Provider) {
    utils.bindDependenciesToInstance(this, arguments);
  }

  angular.extend(MyProfileController.prototype, {
    /**
     * Clears the current profile and then attempts to reacquire it from the API
     * @method confApp.profile.MyProfileCtrl#retrieveProfileCallback
     */
    retrieveProfileCallback: function () {
      this.profile.clear();
      this.loading = true;
      this.profileService.getProfile();
    },
    /**
     * Initializes the My profile page.
     * Update the profile if the user's profile has been stored.
     * @method confApp.profile.MyProfileCtrl#init
     */
    init: function () {
      if (!this.authStatus.signedIn) {
        this.oauth2Provider.showLoginModal().result.then(this.retrieveProfileCallback);
      } else {
        this.retrieveProfileCallback();
      }
    },
    /**
     * Invokes the conference.saveProfile API.
     * @method confApp.profile.MyProfileCtrl#saveProfile
     */
    saveProfile: function () {
      this.loading = true;
      this.conferenceService.saveProfile(this.profile);
    }
  });
})(window.angular);