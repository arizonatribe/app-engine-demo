(function(angular) {
  'use strict';

  /**
   * Root app, which routes and specifies the partial html and controller depending on the url requested.
   * @ngdoc module
   * @name confApp
   * @namespace
   * @requires confApp.api
   * @requires confApp.profile
   * @requires confApp.status
   * @requires confApp.conference
   * @requires confApp.session
   * @requires confApp.speaker
   * @requires ngRoute
   * @requires ui.bootstrap
   */
  angular.module('confApp', [
    'ngRoute',
    'ui.bootstrap',
    'confApp.shared',
    'confApp.api',
    'confApp.profile',
    'confApp.status',
    'confApp.conference',
    'confApp.session',
    'confApp.speaker'
  ]);
})(window.angular);