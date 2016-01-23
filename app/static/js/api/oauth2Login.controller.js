(function(angular) {
  'use strict';

  angular.module('confApp.api')
    .controller('OAuth2LoginModalCtrl', OAuth2LoginModalController);

  /**
   * The controller for the modal dialog that is shown when an user needs to login to achive some functions.
   * @ngdoc controller
   * @name confApp.api.OAuth2LoginModalCtrl
   * @class
   * @constructor
   * @requires confApp.shared.utils
   * @requires $modalInstance
   * @requires confApp.api.oauth2Provider
   * @requires confApp.api.authStatus
   */
  function OAuth2LoginModalController(utils, $modalInstance, oauth2Provider, authStatus) {
    utils.bindDependenciesToInstance(this, arguments);
  }

  angular.extend(OAuth2LoginModalController.prototype, {
    /**
     * Initiates the sign-in from a pop-up window
     * @method confApp.api.OAuth2LoginModalCtrl#singInViaModal
     */
    singInViaModal: function () {
      oauth2Provider.signIn(this.$modalInstance);
    },
    /**
     * Initializes the My profile page.
     * Update the profile if the user's profile has been stored.
     * @method confApp.api.OAuth2LoginModalCtrl#init
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
     * @method confApp.api.OAuth2LoginModalCtrl#saveProfile
     */
    saveProfile: function () {
      this.loading = true;

      this.conferenceService.saveProfile(this.profile);
    }
  });
})(window.angular);