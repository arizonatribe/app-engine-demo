(function(angular) {
  'use strict';

  angular.module('confApp.api')
    .factory('gapi', function($window, gapi, authStatus) {
      return angular.extend($window.gapi, {
        /**
         * Expose a shorthand for `gapi.auth.signIn(settings)`
         * @param callback {function} An optional callback function to execute after successful login
         * @method confApp.api.gapi#login
         * @returns {*}
         */
        login: function(callback) {
          return gapi.auth.signIn(
            angular.extend(gapiSettings, {callback: callback})
          );
        },
        /**
         * Explicitly set the invalid access token in order to make the API calls fail and marks the `authStatus` appropriately.
         * @method confApp.api.gapi#logout
         */
        logout: function() {
          gapi.auth.signOut();
          gapi.auth.setToken({access_token: ''});
          authStatus.signedIn = false;
        }
      });
    });
})(window.angular);
