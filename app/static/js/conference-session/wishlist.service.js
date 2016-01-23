(function(angular) {
  'use strict';

  angular.module('confApp.session')
    .factory('wishlistService', WishlistService);

  function WishlistService(gapi, $q, loading, submitted, statusService) {
    var getSessionsInWishlist = function() {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getSessionsInWishlist()
            .execute(function(resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'Retreive a wishlist')
                );
              } else {
                submitted = false;
                statusService.handleSuccess('Query succeeded', resp.sessions);
                deferred.resolve(resp.sessions);
              }
          });
          submitted = true;

          return deferred.promise;
        },
        addSessionToWishlist = function(sessionKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.addSessionToWishlist({
            websafeSessionKey: sessionKey
          }).execute(function(resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'add session to wishlist')
              );
            } else {
              submitted = false;
              deferred.resolve(statusService.handleSuccess('Session added to wishlist', resp.result));
            }
          });
          submitted = true;

          return deferred.promise;
        },
        deleteSessionInWishlist = function(sessionKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.deleteSessionInWishlist({
            websafeSessionKey: sessionKey
          }).execute(function(resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'remove session from wishlist')
              );
            } else {
              submitted = false;
              deferred.resolve(statusService.handleSuccess('Session removed from wishlist', resp.result));
            }
          });
          submitted = true;

          return deferred.promise;
        };

    return {
      getSessionsInWishlist: getSessionsInWishlist,
      addSessionToWishlist: addSessionToWishlist,
      deleteSessionInWishlist: deleteSessionInWishlist
    };
  }
})(window.angular);