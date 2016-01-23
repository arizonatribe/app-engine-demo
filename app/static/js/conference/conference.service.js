(function(angular) {
  'use strict';

  angular.module('confApp.conference')
    .factory('conferenceService', ConferenceService);

  function ConferenceService(gapi, $q, statusService, loading, submitted) {
    var createConference = function(conference) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.createConference(conference)
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'create a conference')
                );
              } else {
                submitted = false;
                $scope.conference = {};
                deferred.resolve(statusService.handleSuccess('The conference has been created : ' + resp.result.name, resp.result));
              }
            });
          submitted = true;

          return deferred.promise;
        },
        queryConferences = function(sendFilters) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.queryConferences(sendFilters)
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'query conferences')
                );
              } else {
                submitted = false;
                statusService.handleSuccess('Query succeeded', resp.items);
                $scope.conferences;
                deferred.resolve(resp.items);
              }
            });
          submitted = true;

          return deferred.promise;
        },
        getConferencesCreated = function() {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getConferencesCreated()
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'query the conferences created')
                );
              } else {
                submitted = false;
                statusService.handleSuccess('Query succeeded : Conferences you have created', resp.items);
                deferred.resolve(resp.items);
                $scope.conferences = {};
              }
            });
          submitted = true;

          return deferred.promise;
        },
        getConferencesToAttend = function() {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getConferencesToAttend()
            .execute(function (resp) {
              loading = false;
              if (resp.error) {
                deferred.reject(
                  statusService.handleUnauthorized(resp.code) ||
                  statusService.handleError(resp.error, 'query conferences to attend')
                );
              } else {
                submitted = false;
                statusService.handleSuccess('Query succeeded : Conferences you will attend (or you have attended)', resp.result.items);
                deferred.resolve(resp.result.items);
              }
          });
          submitted = true;

          return deferred.promise;
        },
        getConference = function(conferenceKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.getConference({
            websafeConferenceKey: conferenceKey
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'get the conference')
              );
            } else {
              submitted = false;
              statusService.handleSuccess('Query succeeded', resp.result);
              deferred.resolve(resp.result);
            }
          });
          submitted = true;

          return deferred.promise;
        },
        deleteConference = function(conferenceKey) {
          var deferred = $q.defer();

          loading = true;
          gapi.client.conference.deleteConference({
            websafeConferenceKey: conferenceKey
          }).execute(function (resp) {
            loading = false;
            if (resp.error) {
              deferred.reject(
                statusService.handleUnauthorized(resp.code) ||
                statusService.handleError(resp.error, 'remove conference')
              );
            } else {
              submitted = false;
              deferred.resolve(statusService.handleSuccess('Removed the conference', resp.result));
            }
          });
          submitted = true;

          return deferred.promise;
        };

    return {
      createConference: createConference,
      queryConferences: queryConferences,
      getConferencesCreated: getConferencesCreated,
      getConferencesToAttend: getConferencesToAttend,
      getConference: getConference,
      deleteConference: deleteConference
    };
  }
})(window.angular);