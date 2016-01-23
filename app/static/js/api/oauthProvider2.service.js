(function(angular) {
  'use strict';

  angular.module('confApp.api')
    .factory('oauth2Provider', Oauth2Provider);

  /**
   * @ngdoc service
   * @name oauth2Provider
   *
   * @description
   * Service that holds the OAuth2 information shared across all the pages.
   *
   */
  function Oauth2Provider($modal, gapi, alertStatus, statusMessage) {
    /**
     * Calls the OAuth2 authentication method.
     */
    var signIn = function(modalInstance) {
          gapi.login(function () {
            gapi.client.oauth2.userinfo.get()
              .execute(function (resp) {
                authStatus.signedIn = true;
                alertStatus = 'success';
                statusMessage = 'Logged in with ' + resp.email;
                modalInstance && modalInstance.close();
              });
          });
        },
        /**
         * Logs out the user.
         */
        signOut = function() {
          gapi.logout();
        },
        /**
         * Shows the modal with Google+ sign in button.
         * @returns {*|Window}
         */
        showLoginModal = function() {
          return $modal.open({
            templateUrl: '/partials/login.modal.html',
            controller: 'OAuth2LoginModalCtrl',
            controllerAs: 'ctrlOauth2LoginModal'
          });
        };

    return {
      signIn: signIn,
      signOut: signOut,
      showLoginModal: showLoginModal
    };
  }
})(window.angular);