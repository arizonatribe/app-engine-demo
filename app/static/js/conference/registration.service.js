(function(angular) {
  'use strict';
  
  angular.module('confApp.conference')
    .factory('registrationService', RegistrationService);
  
  function RegistrationService(gapi, $q, loading, statusService, submitted) {
    var register = function(conferenceKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.registerForConference({
            websafeConferenceKey: conferenceKey
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'register for the conference')
              );
            } else {
              submitted = false;
              deferred.resolve(statusService.handleSuccess('Registered for the conference', resp.result));
            }
          });
          submitted = true;

          return deferred.promise;
        },
        unregister = function(conferenceKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.unregisterFromConference({
            websafeConferenceKey: conferenceKey
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'unregister from the conference')
              );
            } else {
              submitted = false;
              deferred.resolve(statusService.handleSuccess('Unregistered from the conference', resp.result));
            }
          });
          submitted = true;

          return deferred.promise;
        };

    return {
      register: register,
      unregister: unregister
    };
  }
})(window.angular);