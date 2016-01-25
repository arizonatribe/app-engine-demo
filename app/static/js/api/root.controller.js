(function(angular) {
  'use strict';

  angular.module('confApp.api')
    /**
     * The root controller having a scope of the body element and methods used in the application wide
     * such as user authentications.
     * @ngdoc controller
     * @name confApp.api.RootCtrl
     * @class
     * @constructor
     */
    .controllers.controller('RootCtrl', RootController);
    
  function RootController(utils, loginService, $location, oauth2Provider, authStatus) {
    utils.bindDependenciesToInstance(this, arguments);
  }
  
  angular.extend(RootController.prototype, {
    /**
     * Returns if the viewLocation is the currently viewed page.
     * @method confApp.api.RootCtrl#isActive
     * @param viewLocation
     * @returns {boolean} true if viewLocation is the currently viewed page. Returns false otherwise.
     */
    isActive: function(viewLocation) {
      return viewLocation === this.$location.path();
    },

    /**
     * Returns the OAuth2 signedIn state.
     * @method confApp.api.RootCtrl#getSignedInState
     * @returns {authStatus.signedIn|*} true if siendIn, false otherwise.
     */
    getSignedInState: function() {
      return this.authStatus.signedIn;
    },

    /**
     * Calls the OAuth2 authentication method.
     * @method confApp.api.RootCtrl#signIn
     */
    signIn: function() {
      this.oauth2Provider.signIn();
    },

    /**
     * Render the signInButton and restore the credential if it's stored in the cookie.
     * (Just calling this to restore the credential from the stored cookie. So hiding 
     * the signInButton immediately after the rendering)
     * @method confApp.api.RootCtrl#initSignInButton
     */
    initSignInButton: function() {
      this.loginService.renderSignIn();
    },

    /**
     * Logs out the user.
     * @method confApp.api.RootCtrl#signOut
     */
    signOut: function() {
      this.oauth2Provider.signOut();
    },

    /**
     * Collapses the navbar on mobile devices.
     * @method confApp.api.RootCtrl#collapseNavbar
     */
    collapseNavbar: function() {
      angular.element(document.querySelector('.navbar-collapse')).removeClass('in');
    }
  });
})(window.angular);

