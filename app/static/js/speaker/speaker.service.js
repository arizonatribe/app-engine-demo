(function(angular) {
  'use strict';

  angular.module('confApp.speaker')
    .factory('speakerService', SpeakerService);
  
  function SpeakerService(gapi, $q, submitted, loading, statusService) {
    var createSpeaker = function(speaker) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.createSpeaker(speaker)
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'create a speaker', speaker)
                );
              } else {
                submitted = false;
                deferred.resolve(statusService.handleSuccess('Speaker has been created: ' + resp.displayName, resp));
              }
          });
          submitted = true;

          return deferred.promise;
        },
        getSpeakers = function() {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getSpeakers()
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'retrieve speakers')
                );
              } else {
                submitted = false;
                statusService.handleSuccess('Successfully retrieved a list of ' + resp.speakers.length + ' Speakers ');
                deferred.resolve(resp.speakers);
              }
          });
          submitted = true;

          return deferred.promise;
        },
        getSpeaker = function(speakerKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getSpeaker({
            websafeSpeakerKey: speakerKey
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'get the speaker')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Found a speaker', resp.result);
              deferred.resolve(resp.result);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        getFeaturedSpeaker = function(speakerKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getFeaturedSpeaker({
            websafeSpeakerKey: speakerKey
          }).execute(function(resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'get the featured speaker')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Featured speaker', resp.data);
              deferred.resolve(resp.data);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        saveSpeaker = function(speakerKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.saveSpeaker({
            websafeSpeakerKey: speakerKey
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'save changes for the speaker')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Saved changes for the speaker', resp);
              deferred.resolve(resp.result);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        removeSpeaker = function(speakerKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.removeSpeaker({
            websafeSpeakerKey: speakerKey
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'remove the speaker')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Removed the speaker', resp.result);
              deferred.resolve(resp.result);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        getConferenceSpeakers = function(conferenceKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getConferenceSpeakers({
            websafeConferenceKey: conferenceKey
          }).execute(function(resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'get conference speakers')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Found conference speakers', resp.speakers);
              deferred.resolve(resp.speakers);
            }
          });
          submitted = true;

          return deferred.promise;
        };

    return {
      createSpeaker: createSpeaker,
      getSpeakers: getSpeakers,
      getSpeaker: getSpeaker,
      getFeaturedSpeaker: getFeaturedSpeaker,
      saveSpeaker: saveSpeaker,
      removeSpeaker: removeSpeaker,
      getConferenceSpeakers: getConferenceSpeakers
    };
  }  
})(window.angular);