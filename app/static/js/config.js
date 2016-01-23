(function(angular) {
  'use strict';

  angular.module('confApp')
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider
        .when('/conference', {
          templateUrl: '/partials/show_conferences.html',
          controller: 'ShowConferenceCtrl',
          controllerAs: 'ctrlShowConference'
        })
        .when('/conference/create', {
          templateUrl: '/partials/create_conferences.html',
          controller: 'CreateConferenceCtrl',
          controllerAs: 'ctrlCreateConference'
        })
        .when('/conference/detail/:websafeConferenceKey', {
          templateUrl: '/partials/conference_detail.html',
          controller: 'ConferenceDetailCtrl',
          controllerAs: 'ctrlConferenceDetail'
        })
        .when('/session/type/:sessionType', {
          templateUrl: '/partials/show_sessions.html',
          controller: 'ShowSessionCtrl',
          controllerAs: 'ctrlShowSession'
        })
        .when('/sessions', {
          templateUrl: '/partials/show_sessions.html',
          controller: 'ShowSessionCtrl',
          controllerAs: 'ctrlShowSession'
        })
        .when('/conference/:websafeConferenceKey/session/create', {
          templateUrl: '/partials/create_session.html',
          controller: 'CreateSessionCtrl',
          controllerAs: 'ctrlCreateSession'
        })
        .when('/conference/:websafeConferenceKey/session', {
          templateUrl: '/partials/show_sessions.html',
          controller: 'ShowSessionCtrl',
          controllerAs: 'ctrlShowSession'
        })
        .when('/conference/:websafeConferenceKey/session/:websafeSessionKey', {
          templateUrl: '/partials/session_detail.html',
          controller: 'SessionDetailCtrl',
          controllerAs: 'ctrlSessionDetail'
        })
        .when('/session/:websafeSessionKey', {
          templateUrl: '/partials/session_detail.html',
          controller: 'SessionDetailCtrl',
          controllerAs: 'ctrlSessionDetail'
        })
        .when('/speaker/create', {
          templateUrl: '/partials/create_speaker.html',
          controller: 'CreateSpeakerCtrl',
          controllerAs: 'ctrlCreateSpeaker'
        })
        .when('/speaker/detail/:websafeSpeakerKey', {
          templateUrl: '/partials/speaker_detail.html',
          controller: 'SpeakerDetailCtrl',
          controllerAs: 'ctrlSpeakerDetail'
        })
        .when('/speaker', {
          templateUrl: '/partials/show_speakers.html',
          controller: 'ShowSpeakerCtrl',
          controllerAs: 'ctrlShowSpeaker'
        })
        .when('/profile', {
          templateUrl: '/partials/profile.html',
          controller: 'MyProfileCtrl',
          controllerAs: 'ctrlMyProfile'
        })
        .when('/', {
          templateUrl: '/partials/home.html'
        })
        .otherwise({
          redirectTo: '/'
        });
      }]);
})(window.angular);