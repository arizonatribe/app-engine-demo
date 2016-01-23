(function(angular) {
  angular.module('confApp.session')
    .controller('SessionDetailCtrl', SessionDetailController);

  /**
   * A controller used for the conference session detail page.
   * @ngdoc controller
   * @name confApp.session.SessionDetailCtrl
   * @class
   * @constructor
   * @requires confApp.shared.utils
   * @requires $q
   * @requires $location
   * @requires confApp.session.sessionService
   * @requires confApp.session.wishlistService
   * @requires $routeParams
   */
  function SessionDetailController(utils, $q, $location, sessionService, wishlistService, $routeParams) {
    utils.bindDependenciesToInstance(this, arguments);
    this.wishlist = [];
    this.websafeSessionKey = $routeParams.websafeSessionKey;
  }

  angular.extend(SessionDetailController.prototype, {
    /**
     * Controls whether the user sees an Add or Remove from session wishlist button
     * @method confApp.session.SessionDetailCtrl#toggleAddRemoveCaption
     */
    toggleAddRemoveCaption: function () {
      this.isInWishlist = !!this.wishlist.some(function(sess) {
        return sess.websafeSessionKey === this.websafeSessionKey;
      }.bind(this));
    },
    /**
     * Initializes the conference session detail page.
     * Invokes the session.getConferenceSession method and sets the returned session in the $scope.
     * @method confApp.session.SessionDetailCtrl#init
     */
    init: function() {
      var getConferenceSession = this.sessionService.getConferenceSession(this.$routeParams.websafeSessionKey).then(function (res) {
            this.session = res;
          }.bind(this)),
          getSessionsInWishlist = this.wishlistService.getSessionsInWishlist().then(function (res) {
            this.wishlist = res || [];
          }.bind(this));

      this.$q.all([
        getConferenceSession,
        getSessionsInWishlist
      ]).finally(function () {
        this.toggleAddRemoveCaption();
      }.bind(this));
    },
    /**
     * Adds this current conference session to the user's wishlist
     * @method confApp.session.SessionDetailCtrl#addToWishlist
     */
    addToWishlist: function() {
      this.wishlistService.addSessionToWishlist(this.websafeSessionKey).then(function (res) {
        this.session = res;
        this.toggleAddRemoveCaption();
        this.$location.path('/sessions');
      }.bind(this));
    },
    /**
     * Removes this current conference session from the user's wishlist
     * @method confApp.session.SessionDetailCtrl#deleteSessionInWishlist
     */
    deleteSessionInWishlist: function() {
      this.wishlistService.deleteSessionInWishlist(this.websafeSessionKey).then(function () {
        this.toggleAddRemoveCaption();
        this.$location.path('/sessions');
      });
    },
    /**
     * Removes this current conference session altogether
     * @method confApp.session.SessionDetailCtrl#deleteConferenceSession
     */
    deleteConferenceSession: function() {
      this.sessionService.deleteConferenceSession(this.websafeSessionKey).then(function () {
        this.$location.path('/sessions');
      });
    }
  });
})(window.angular);
