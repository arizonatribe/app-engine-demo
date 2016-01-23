(function(angular) {
  'use strict';

  angular.module('confApp.profile')
    .factory('profileService', ProfileService);

  function ProfileService(gapi, $q, statusService, profile, loading, submitted) {
    var getProfile = function() {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getProfile()
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(statusService.handleError(resp.error, 'get a user profile'));
              } else {
                submitted = false;
                profile.set(resp.result);
                deferred.resolve(statusService.handleSuccess('Retrieved profile', resp.result));
              }
            });
          submitted = true;

          return deferred.promise;
        },
        saveProfile = function() {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.saveProfile(profile)
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'update a profile')
                );
              } else {
                submitted = false;
                profile.set({
                  displayName: profile.value.displayName,
                  teeShirtSize: profile.value.teeShirtSize
                });
                deferred.resolve(statusService.handleSuccess('The profile has been updated', resp.result));
              }
            });
          submitted = true;

          return deferred.promise;
        };

    return {
      getProfile: getProfile,
      saveProfile: saveProfile
    };
  }
})(window.angular);