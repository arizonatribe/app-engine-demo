(function(angular) {
  'use strict';

  angular.module('confApp.session')
    .factory('sessionService', SessionService);

  function SessionService(gapi, $q, submitted, loading, statusService) {
    var getAllSessions = function() {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getAllSessions()
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'query sessions')
                );
              } else {
                submitted = false;
                statusService.handleSuccess('Query succeeded');
                deferred.resolve(resp.items);
              }
            });
          submitted = true;

          return deferred.promise;
        },
        getConferenceSessions = function(conferenceKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getConferenceSessions({
            websafeConferenceKey: conferenceKey 
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'query conference sessions')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Query succeeded');
              deferred.resolve(resp.items);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        getSessionsBySpeaker = function(speakerId) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getSessionsBySpeaker({
            speakerUserId: speakerId
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'query sessions')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Query succeeded');
              deferred.resolve(resp.items);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        getDaytimeNonWorkshopSessions = function() {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getDaytimeNonWorkshopSessions()
            .execute(function(resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'query early sessions')
                );
              } else {
                submitted = false;
                statusService.handleSuccess('Query succeeded');
                deferred.resolve(resp.items);
              }
            });
          submitted = true;

          return deferred.promise;
        },
        getAllSessionsByType = function(sessionType, conferenceKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getAllSessionsByType({
            sessionType: sessionType,
            websafeConferenceKey: conferenceKey
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'query sessions')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Query succeeded');
              deferred.resolve(resp.items);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        getConferenceSession = function(sessionKey) {
          var deferred = $q.defer();
  
          loading = true;
          gapi.client.conference.getConferenceSession({
            websafeSessionKey: sessionKey
          }).execute(function (resp) {
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'get the conference session')
              );
            } else {
              statusService.handleSuccess('Found the conference session', resp.result);
              deferred.resolve(resp.result);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        createConferenceSession = function(confSession) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.createConferenceSession(confSession)
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'create a conference session', confSession)
                );
              } else {
                submitted = false;
                deferred.resolve(
                  statusService.handleSuccess('The conference session has been created : ' + resp.result.name, resp.result)
                );
              }
          });
          submitted = true;

          return deferred.promise;
        },
        deleteConferenceSession = function(sessionKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.deleteConferenceSession({
            websafeSessionKey: sessionKey
          }).execute(function(resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'remove session')
              );
            } else {
              statusService.handleSuccess('Session Removed', resp);
              deferred.resolve(resp.items);
            }
          });
          submitted = true;

          return deferred.promise;
        };

    return {
      getAllSessions: getAllSessions,
      getConferenceSessions: getConferenceSessions,
      getSessionsBySpeaker: getSessionsBySpeaker, 
      getDaytimeNonWorkshopSessions: getDaytimeNonWorkshopSessions, 
      getAllSessionsByType: getAllSessionsByType,
      createConferenceSession: createConferenceSession, 
      getConferenceSession: getConferenceSession,
      deleteConferenceSession: deleteConferenceSession
    };
  }
})(window.angular);