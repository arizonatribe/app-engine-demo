'use strict';

/**
 * The root conferenceApp module.
 *
 * @type {conferenceApp|*|{}}
 */
var conferenceApp = conferenceApp || {};

/**
 * @ngdoc module
 * @name conferenceControllers
 *
 * @description
 * Angular module for controllers.
 *
 */
conferenceApp.controllers = angular.module('conferenceControllers', ['ui.bootstrap']);


/**
 * @ngdoc controller
 * @name ShowSpeakerCtrl
 *
 * @description
 * A controller used for the Show speakers page.
 */
conferenceApp.controllers.controller('ShowSpeakerCtrl', function ($scope, $log, oauth2Provider, HTTP_ERRORS) {

    /**
     * Holds the status if the query is being executed.
     * @type {boolean}
     */
    $scope.submitted = false;

    /**
     * Holds the speakers currently displayed in the page.
     * @type {Array}
     */
    $scope.speakers = [];

    /**
     * Namespace for the pagination.
     * @type {{}|*}
     */
    $scope.pagination = $scope.pagination || {};
    $scope.pagination.currentPage = 0;
    $scope.pagination.pageSize = 20;
    /**
     * Returns the number of the pages in the pagination.
     *
     * @returns {number}
     */
    $scope.pagination.numberOfPages = function () {
        return Math.ceil($scope.speakers.length / $scope.pagination.pageSize);
    };

    /**
     * Returns an array including the numbers from 1 to the number of the pages.
     *
     * @returns {Array}
     */
    $scope.pagination.pageArray = function () {
        var pages = [];
        var numberOfPages = $scope.pagination.numberOfPages();
        for (var i = 0; i < numberOfPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    /**
     * Checks if the target element that invokes the click event has the "disabled" class.
     *
     * @param event the click event
     * @returns {boolean} if the target element that has been clicked has the "disabled" class.
     */
    $scope.pagination.isDisabled = function (event) {
        return angular.element(event.target).hasClass('disabled');
    };

    /**
     * Retrieve the list of speakers.
     *
     */
    $scope.getSpeakers = function () {
        $scope.submitted = false;
        $scope.loading = true;
        gapi.client.conference.getSpeakers()
            .execute(function (resp) {
                $scope.$apply(function () {
                    $scope.loading = false;
                    if (resp.error) {
                        // The request has failed.
                        var errorMessage = resp.error.message || '';
                        $scope.messages = 'Failed to retrieve speakers : ' + errorMessage;
                        $scope.alertStatus = 'warning';
                    } else {
                        // The request has succeeded.
                        $scope.submitted = false;
                        $scope.messages = 'Successfully retrieved a list of ' + resp.speakers.length + ' Speakers ';
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);

                        $scope.speakers = [];
                        angular.forEach(resp.speakers, function (speaker) {
                            $scope.speakers.push(speaker);
                        });
                    }
                    $scope.submitted = true;
                });
            });
    };
});

/**
 * @ngdoc controller
 * @name ShowSessionCtrl
 *
 * @description
 * A controller used for the Show conference sessions page.
 */
conferenceApp.controllers.controller('ShowSessionCtrl', function ($scope, $log, oauth2Provider, authStatus, HTTP_ERRORS) {

    /**
     * Holds the status if the query is being executed.
     * @type {boolean}
     */
    $scope.submitted = false;

    $scope.selectedTab = 'ALL';

    /**
     * Holds the filter that will be applied when getSessions is invoked.
     * @type {object}
     */
    $scope.filter = {
        selected: ''
    };

    /**
     * Holds the default values for the input candidates for topics select.
     * @type {string[]}
     */
    $scope.types = [
        'UNKNOWN',
        'WORKSHOP',
        'LECTURE',
        'KEYNOTE',
        'MEETUP'
    ];
    
    $scope.speakers = [];
    gapi.client.conference.getSpeakers().execute(function(resp) {
      $scope.$apply(function() {
          if (!resp.error) {
            $scope.speakers = resp.speakers;
          }
      });
    });
    
    /**
     * Holds the sessions currently displayed in the page.
     * @type {Array}
     */
    $scope.sessions = [];

    /**
     * Holds the state if offcanvas is enabled.
     *
     * @type {boolean}
     */
    $scope.isOffcanvasEnabled = false;

    /**
     * Sets the selected tab to 'ALL'
     */
    $scope.tabAllSelected = function () {
        $scope.selectedTab = 'ALL';
        $scope.querySessions();
    };

    /**
     * Sets the selected tab to 'YOU_WISH'
     */
    $scope.tabYouWishSelected = function () {
        $scope.selectedTab = 'YOU_WISH';
        if (!authStatus.signedIn) {
            oauth2Provider.showLoginModal();
            return;
        }
        $scope.querySessions();
    };

    /**
     * Toggles the status of the offcanvas.
     */
    $scope.toggleOffcanvas = function () {
        $scope.isOffcanvasEnabled = !$scope.isOffcanvasEnabled;
    };

    /**
     * Namespace for the pagination.
     * @type {{}|*}
     */
    $scope.pagination = $scope.pagination || {};
    $scope.pagination.currentPage = 0;
    $scope.pagination.pageSize = 20;
    /**
     * Returns the number of the pages in the pagination.
     *
     * @returns {number}
     */
    $scope.pagination.numberOfPages = function () {
        return Math.ceil($scope.sessions.length / $scope.pagination.pageSize);
    };

    /**
     * Returns an array including the numbers from 1 to the number of the pages.
     *
     * @returns {Array}
     */
    $scope.pagination.pageArray = function () {
        var pages = [];
        var numberOfPages = $scope.pagination.numberOfPages();
        for (var i = 0; i < numberOfPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    /**
     * Checks if the target element that invokes the click event has the "disabled" class.
     *
     * @param event the click event
     * @returns {boolean} if the target element that has been clicked has the "disabled" class.
     */
    $scope.pagination.isDisabled = function (event) {
        return angular.element(event.target).hasClass('disabled');
    };

    /**
     * Adds a filter and set the default value.
     */
    $scope.addFilter = function (key) {
        if ($scope.filter[key.toLowerCase()]) {
            $scope.filter.selected = key;
        } else {
            $scope.filter.selected = '';
        }
        ['TYPE', 'SPEAKER', 'EARLY'].forEach(function(val) {
           if (key !== val) $scope.filter[val.toLowerCase()] = ''; 
        });
    };

    /**
     * Clears filter.
     */
    $scope.clearFilters = function () {
        $scope.filter = {
            selected: '',
            type: '',
            speaker: ''
        };
        gapi.client.conference.getAllSessions()
            .execute(function (resp) {
                $scope.$apply(function () {
                    $scope.loading = false;
                    if (resp.error) {
                        // The request has failed.
                        var errorMessage = resp.error.message || '';
                        $scope.messages = 'Failed to query sessions : ' + errorMessage;
                        $scope.alertStatus = 'warning';
                    } else {
                        // The request has succeeded.
                        $scope.submitted = false;
                        $scope.messages = 'Query succeeded ';
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);

                        $scope.sessions = [];
                        angular.forEach(resp.items, function (session) {
                            $scope.sessions.push(session);
                        });
                    }
                    $scope.submitted = true;
                });
            });        
    };

    /**
     * Query the sessions depending on the tab currently selected.
     *
     */
    $scope.querySessions = function () {
        $scope.submitted = false;
        if ($scope.selectedTab == 'ALL') {
            $scope.getSessions();
        } else if ($scope.selectedTab == 'YOU_WISH') {
            $scope.getSessionsInWishlist();
        }
    };

    /**
     * Invokes the conference.queryConferences API.
     */
    $scope.getSessions = function () {
        $scope.loading = true;
        if ($scope.filter.selected) {
            if ($scope.filter.selected === 'SPEAKER') {
                gapi.client.conference.getSessionsBySpeaker({
                        speakerUserId: $scope.filter.speaker
                    }).execute(function (resp) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            if (resp.error) {
                                // The request has failed.
                                var errorMessage = resp.error.message || '';
                                $scope.messages = 'Failed to query sessions : ' + errorMessage;
                                $scope.alertStatus = 'warning';
                            } else {
                                // The request has succeeded.
                                $scope.submitted = false;
                                $scope.messages = 'Query succeeded ';
                                $scope.alertStatus = 'success';
                                $log.info($scope.messages);
        
                                $scope.sessions = [];
                                angular.forEach(resp.items, function (session) {
                                    $scope.sessions.push(session);
                                });
                            }
                            $scope.submitted = true;
                        });
                    });
            } else if ($scope.filter.selected === 'EARLY') {
                gapi.client.conference.getDaytimeNonWorkshopSessions().execute(function (resp) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            if (resp.error) {
                                // The request has failed.
                                var errorMessage = resp.error.message || '';
                                $scope.messages = 'Failed to query early sessions : ' + errorMessage;
                                $scope.alertStatus = 'warning';
                            } else {
                                // The request has succeeded.
                                $scope.submitted = false;
                                $scope.messages = 'Query succeeded ';
                                $scope.alertStatus = 'success';
                                $log.info($scope.messages);
        
                                $scope.sessions = [];
                                angular.forEach(resp.items, function (session) {
                                    $scope.sessions.push(session);
                                });
                            }
                            $scope.submitted = true;
                        });
                    });   
            } else {
                gapi.client.conference.getAllSessionsByType({
                        sessionType: $scope.filter.type
                    }).execute(function (resp) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            if (resp.error) {
                                // The request has failed.
                                var errorMessage = resp.error.message || '';
                                $scope.messages = 'Failed to query sessions : ' + errorMessage;
                                $scope.alertStatus = 'warning';
                            } else {
                                // The request has succeeded.
                                $scope.submitted = false;
                                $scope.messages = 'Query succeeded ';
                                $scope.alertStatus = 'success';
                                $log.info($scope.messages);
        
                                $scope.sessions = [];
                                angular.forEach(resp.items, function (session) {
                                    $scope.sessions.push(session);
                                });
                            }
                            $scope.submitted = true;
                        });
                    });
            }
        } else {
            $scope.clearFilters();
        }
    };

    /**
     * Retrieves the sessions in your wishlist
     */
    $scope.getSessionsInWishlist = function () {
        $scope.loading = true;
        gapi.client.conference.getSessionsInWishlist()
            .execute(function (resp) {
                $scope.$apply(function () {
                    if (resp.error) {
                        // The request has failed.
                        var errorMessage = resp.error.message || '';
                        $scope.messages = 'Failed to query the sessions in your wishlist : ' + errorMessage;
                        $scope.alertStatus = 'warning';
                        $log.error($scope.messages);

                        if (resp.code && resp.code == HTTP_ERRORS.UNAUTHORIZED) {
                            oauth2Provider.showLoginModal();
                            return;
                        }
                    } else {
                        // The request has succeeded.
                        $scope.sessions = resp.sessions;
                        $scope.loading = false;
                        $scope.messages = 'Query succeeded : Sessions in your wishlist';
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);
                    }
                    $scope.submitted = true;
                });
            });
    };
});

/**
 * @ngdoc controller
 * @name ShowConferenceCtrl
 *
 * @description
 * A controller used for the Show conferences page.
 */
conferenceApp.controllers.controller('ShowConferenceCtrl', function ($scope, $log, oauth2Provider, authStatus, HTTP_ERRORS) {

    /**
     * Holds the status if the query is being executed.
     * @type {boolean}
     */
    $scope.submitted = false;

    $scope.selectedTab = 'ALL';

    /**
     * Holds the filters that will be applied when queryConferencesAll is invoked.
     * @type {Array}
     */
    $scope.filters = [
    ];

    $scope.filtereableFields = [
        {enumValue: 'CITY', displayName: 'City'},
        {enumValue: 'TOPIC', displayName: 'Topic'},
        {enumValue: 'MONTH', displayName: 'Start month'},
        {enumValue: 'MAX_ATTENDEES', displayName: 'Max Attendees'}
    ];

    /**
     * Possible operators.
     *
     * @type {{displayName: string, enumValue: string}[]}
     */
    $scope.operators = [
        {displayName: '=', enumValue: 'EQ'},
        {displayName: '>', enumValue: 'GT'},
        {displayName: '>=', enumValue: 'GTEQ'},
        {displayName: '<', enumValue: 'LT'},
        {displayName: '<=', enumValue: 'LTEQ'},
        {displayName: '!=', enumValue: 'NE'}
    ];

    /**
     * Holds the conferences currently displayed in the page.
     * @type {Array}
     */
    $scope.conferences = [];

    /**
     * Holds the state if offcanvas is enabled.
     *
     * @type {boolean}
     */
    $scope.isOffcanvasEnabled = false;

    /**
     * Sets the selected tab to 'ALL'
     */
    $scope.tabAllSelected = function () {
        $scope.selectedTab = 'ALL';
        $scope.queryConferences();
    };

    /**
     * Sets the selected tab to 'YOU_HAVE_CREATED'
     */
    $scope.tabYouHaveCreatedSelected = function () {
        $scope.selectedTab = 'YOU_HAVE_CREATED';
        if (!authStatus.signedIn) {
            oauth2Provider.showLoginModal();
            return;
        }
        $scope.queryConferences();
    };

    /**
     * Sets the selected tab to 'YOU_WILL_ATTEND'
     */
    $scope.tabYouWillAttendSelected = function () {
        $scope.selectedTab = 'YOU_WILL_ATTEND';
        if (!authStatus.signedIn) {
            oauth2Provider.showLoginModal();
            return;
        }
        $scope.queryConferences();
    };

    /**
     * Toggles the status of the offcanvas.
     */
    $scope.toggleOffcanvas = function () {
        $scope.isOffcanvasEnabled = !$scope.isOffcanvasEnabled;
    };

    /**
     * Namespace for the pagination.
     * @type {{}|*}
     */
    $scope.pagination = $scope.pagination || {};
    $scope.pagination.currentPage = 0;
    $scope.pagination.pageSize = 20;
    /**
     * Returns the number of the pages in the pagination.
     *
     * @returns {number}
     */
    $scope.pagination.numberOfPages = function () {
        return Math.ceil($scope.conferences.length / $scope.pagination.pageSize);
    };

    /**
     * Returns an array including the numbers from 1 to the number of the pages.
     *
     * @returns {Array}
     */
    $scope.pagination.pageArray = function () {
        var pages = [];
        var numberOfPages = $scope.pagination.numberOfPages();
        for (var i = 0; i < numberOfPages; i++) {
            pages.push(i);
        }
        return pages;
    };

    /**
     * Checks if the target element that invokes the click event has the "disabled" class.
     *
     * @param event the click event
     * @returns {boolean} if the target element that has been clicked has the "disabled" class.
     */
    $scope.pagination.isDisabled = function (event) {
        return angular.element(event.target).hasClass('disabled');
    };

    /**
     * Adds a filter and set the default value.
     */
    $scope.addFilter = function () {
        $scope.filters.push({
            field: $scope.filtereableFields[0],
            operator: $scope.operators[0],
            value: ''
        });
    };

    /**
     * Clears all filters.
     */
    $scope.clearFilters = function () {
        $scope.filters = [];
    };

    /**
     * Removes the filter specified by the index from $scope.filters.
     *
     * @param index
     */
    $scope.removeFilter = function (index) {
        if ($scope.filters[index]) {
            $scope.filters.splice(index, 1);
        }
    };

    /**
     * Query the conferences depending on the tab currently selected.
     *
     */
    $scope.queryConferences = function () {
        $scope.submitted = false;
        if ($scope.selectedTab == 'ALL') {
            $scope.queryConferencesAll();
        } else if ($scope.selectedTab == 'YOU_HAVE_CREATED') {
            $scope.getConferencesCreated();
        } else if ($scope.selectedTab == 'YOU_WILL_ATTEND') {
            $scope.getConferencesAttend();
        }
    };

    /**
     * Invokes the conference.queryConferences API.
     */
    $scope.queryConferencesAll = function () {
        var sendFilters = {
            filters: []
        };
        for (var i = 0; i < $scope.filters.length; i++) {
            var filter = $scope.filters[i];
            if (filter.field && filter.operator && filter.value) {
                sendFilters.filters.push({
                    field: filter.field.enumValue,
                    operator: filter.operator.enumValue,
                    value: filter.value
                });
            }
        }
        $scope.loading = true;
        gapi.client.conference.queryConferences(sendFilters).
            execute(function (resp) {
                $scope.$apply(function () {
                    $scope.loading = false;
                    if (resp.error) {
                        // The request has failed.
                        var errorMessage = resp.error.message || '';
                        $scope.messages = 'Failed to query conferences : ' + errorMessage;
                        $scope.alertStatus = 'warning';
                        $log.error($scope.messages + ' filters : ' + JSON.stringify(sendFilters));
                    } else {
                        // The request has succeeded.
                        $scope.submitted = false;
                        $scope.messages = 'Query succeeded : ' + JSON.stringify(sendFilters);
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);

                        $scope.conferences = [];
                        angular.forEach(resp.items, function (conference) {
                            $scope.conferences.push(conference);
                        });
                    }
                    $scope.submitted = true;
                });
            });
    };

    /**
     * Invokes the conference.getConferencesCreated method.
     */
    $scope.getConferencesCreated = function () {
        $scope.loading = true;
        gapi.client.conference.getConferencesCreated()
            .execute(function (resp) {
                $scope.$apply(function () {
                    $scope.loading = false;
                    if (resp.error) {
                        // The request has failed.
                        var errorMessage = resp.error.message || '';
                        $scope.messages = 'Failed to query the conferences created : ' + errorMessage;
                        $scope.alertStatus = 'warning';
                        $log.error($scope.messages);

                        if (resp.code && resp.code == HTTP_ERRORS.UNAUTHORIZED) {
                            oauth2Provider.showLoginModal();
                            return;
                        }
                    } else {
                        // The request has succeeded.
                        $scope.submitted = false;
                        $scope.messages = 'Query succeeded : Conferences you have created';
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);

                        $scope.conferences = [];
                        angular.forEach(resp.items, function (conference) {
                            $scope.conferences.push(conference);
                        });
                    }
                    $scope.submitted = true;
                });
            });
    };

    /**
     * Retrieves the conferences to attend by calling the conference.getProfile method and
     * invokes the conference.getConference method n times where n == the number of the conferences to attend.
     */
    $scope.getConferencesAttend = function () {
        $scope.loading = true;
        gapi.client.conference.getConferencesToAttend().
            execute(function (resp) {
                $scope.$apply(function () {
                    if (resp.error) {
                        // The request has failed.
                        var errorMessage = resp.error.message || '';
                        $scope.messages = 'Failed to query the conferences to attend : ' + errorMessage;
                        $scope.alertStatus = 'warning';
                        $log.error($scope.messages);

                        if (resp.code && resp.code == HTTP_ERRORS.UNAUTHORIZED) {
                            oauth2Provider.showLoginModal();
                            return;
                        }
                    } else {
                        // The request has succeeded.
                        $scope.conferences = resp.result.items;
                        $scope.loading = false;
                        $scope.messages = 'Query succeeded : Conferences you will attend (or you have attended)';
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);
                    }
                    $scope.submitted = true;
                });
            });
    };
});


/**
 * @ngdoc controller
 * @name ConferenceDetailCtrl
 *
 * @description
 * A controller used for the conference detail page.
 */
conferenceApp.controllers.controller('ConferenceDetailCtrl', function ($scope, $q, $log, $location, $routeParams, HTTP_ERRORS) {
    $scope.conference = {};
    $scope.loading = false;
    $scope.isUserAttending = false;
    
    /**
     * Holds the sessions currently displayed in the page.
     * @type {Array}
     */
    $scope.sessions = [];

    /**
     * Holds the filter that will be applied when getSessions is invoked.
     * @type {object}
     */
    $scope.filter = {
        selected: ''
    };

    /**
     * Holds the default values for the input candidates for topics select.
     * @type {string[]}
     */
    $scope.types = [
        'UNKNOWN',
        'WORKSHOP',
        'LECTURE',
        'KEYNOTE',
        'MEETUP'
    ];
    /**
     * Adds a filter and set the default value.
     */
    $scope.addFilter = function (key) {
        if ($scope.filter[key.toLowerCase()]) {
            $scope.filter.selected = key;
        } else {
            $scope.filter.selected = '';
        }
        ['TYPE', 'SPEAKER', 'EARLY'].forEach(function(val) {
           if (key !== val) $scope.filter[val.toLowerCase()] = ''; 
        });
    };

    /**
     * Clears filter.
     */
    $scope.clearFilters = function () {
        $scope.filter = {
            selected: '',
            type: '',
            speaker: ''
        };
        gapi.client.conference.getAllSessions()
            .execute(function (resp) {
                $scope.$apply(function () {
                    $scope.loading = false;
                    if (resp.error) {
                        // The request has failed.
                        var errorMessage = resp.error.message || '';
                        $scope.messages = 'Failed to query sessions : ' + errorMessage;
                        $scope.alertStatus = 'warning';
                    } else {
                        // The request has succeeded.
                        $scope.submitted = false;
                        $scope.messages = 'Query succeeded ';
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);

                        $scope.sessions = [];
                        angular.forEach(resp.items, function (session) {
                            $scope.sessions.push(session);
                        });
                    }
                    $scope.submitted = true;
                });
            });        
    };    

    $scope.pagination = paginationService($scope.sessions);
    /**
     * Initializes the conference detail page.
     * Invokes the conference.getConference method and sets the returned conference in the $scope.
     *
     */
    $scope.init = function () {
        var deferred1 = $q.defer(),
            deferred2 = $q.defer(),
            deferred3 = $q.defer(),
            deferred4 = $q.defer();
            
        $scope.loading = true;
        gapi.client.conference.getConference({
            websafeConferenceKey: $routeParams.websafeConferenceKey
        }).execute(function (resp) {
            $scope.$apply(function () {
                if (resp.error) {
                    // The request has failed.
                    var errorMessage = resp.error.message || '';
                    $scope.messages = 'Failed to get the conference : ' + $routeParams.websafeConferenceKey
                        + ' ' + errorMessage;
                    $scope.alertStatus = 'warning';
                    $log.error($scope.messages);
                    deferred1.reject($scope.messages);
                } else {
                    // The request has succeeded.
                    $scope.alertStatus = 'success';
                    $scope.conference = resp.result;
                    deferred1.resolve(resp.result);
                }
            });
        });
        // If the user is attending the conference, updates the status message and available function.
        gapi.client.conference.getProfile().execute(function (resp) {
            $scope.$apply(function () {
                if (resp.error) {
                    // Failed to get a user profile.
                    deferred2.reject(resp.error);
                } else {
                    var profile = resp.result;
                    if (profile && profile.conferenceKeysToAttend && profile.conferenceKeysToAttend.length) {
                        profile.conferenceKeysToAttend.forEach(function(key) {
                            if ($routeParams.websafeConferenceKey === key) {
                                // The user is attending the conference.
                                $scope.alertStatus = 'info';
                                $scope.messages = 'You are attending this conference';
                                $scope.isUserAttending = true;
                            }
                        });
                    }
                    deferred2.resolve(profile);
                }
            });
        });
        gapi.client.conference.getConferenceSessions({
           websafeConferenceKey: $routeParams.websafeConferenceKey 
        }).execute(function (resp) {
            $scope.$apply(function () {
                if (resp.error) {
                    // The request has failed.
                    var errorMessage = resp.error.message || '';
                    $scope.messages = 'Failed to query conference sessions : ' + errorMessage;
                    $scope.alertStatus = 'warning';
                    deferred3.reject($scope.messages);
                } else {
                    // The request has succeeded.
                    $scope.submitted = false;
                    $scope.alertStatus = 'success';
                    $log.info($scope.messages);

                    $scope.sessions = [];
                    angular.forEach(resp.items, function (session) {
                        $scope.sessions.push(session);
                    });
                    deferred3.resolve($scope.sessions);
                }
            });
        });
        gapi.client.conference.getConferenceSpeakers({
           websafeConferenceKey: $routeParams.websafeConferenceKey 
        }).execute(function(resp) {
          $scope.$apply(function() {
            if (resp.error) {
              deferred4.reject(resp.error);
            } else {
              $scope.speakers = resp.speakers;
              deferred4.resolve(resp.speakers);
            }
          });
        });
        $q.all([
            deferred1.promise,
            deferred2.promise,
            deferred3.promise,
            deferred4.promise
        ]).finally(function() {
            $scope.loading = false;
        });
    };

    /**
     * Invokes the conference.registerForConference method.
     */
    $scope.registerForConference = function () {
        registrationService.register($routeParams.websafeConferenceKey).then(function() {
            $scope.isUserAttending = true;
            $scope.conference.seatsAvailable = $scope.conference.seatsAvailable + 1;
        });
    };

    /**
     * Invokes the conference.unregisterForConference method.
     */
    $scope.unregisterFromConference = function () {
        registrationService.unregister($routeParams.websafeConferenceKey).then(function() {
            $scope.conference.seatsAvailable = $scope.conference.seatsAvailable + 1;
            $scope.isUserAttending = false;
        });
    };
    
    /**
     * Invokes the conference.removeConference method.
     */
    $scope.removeConference = function () {
        $scope.loading = true;
        gapi.client.conference.deleteConference({
            websafeConferenceKey: $routeParams.websafeConferenceKey
        }).execute(function (resp) {
            $scope.$apply(function () {
                $scope.loading = false;
                if (resp.error) {
                    // The request has failed.
                    var errorMessage = resp.error.message || '';
                    $scope.messages = 'Failed to remove conference : ' + errorMessage;
                    $scope.alertStatus = 'warning';
                    $log.error($scope.messages);
                    if (resp.code && resp.code == HTTP_ERRORS.UNAUTHORIZED) {
                        oauth2Provider.showLoginModal();
                        return;
                    }
                } else {
                    if (resp.result) {
                        // Removal succeeded.
                        $scope.messages = 'Removed the conference';
                        $scope.alertStatus = 'success';
                        $log.info($scope.messages);
                        $location.path('/conference');
                    } else {
                        $scope.messages = 'Failed to remove the conference : ' + $routeParams.websafeConferenceKey +
                            ' : ' + errorMessage;
                        $scope.messages = 'Failed to remove the conference';
                        $scope.alertStatus = 'warning';
                        $log.error($scope.messages);
                    }
                }
            });
        });
    };
    
    $scope.querySessions = function () {
        $scope.loading = true;
        if ($scope.filter.selected) {
            if ($scope.filter.selected === 'SPEAKER') {
                gapi.client.conference.getSessionsBySpeaker({
                        speakerUserId: $scope.filter.speaker
                    }).execute(function (resp) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            if (resp.error) {
                                // The request has failed.
                                var errorMessage = resp.error.message || '';
                                $scope.messages = 'Failed to query sessions : ' + errorMessage;
                                $scope.alertStatus = 'warning';
                            } else {
                                // The request has succeeded.
                                $scope.submitted = false;
                                $scope.messages = 'Query succeeded ';
                                $scope.alertStatus = 'success';
                                $log.info($scope.messages);
        
                                $scope.sessions = [];
                                angular.forEach(resp.items, function (session) {
                                    $scope.sessions.push(session);
                                });
                            }
                            $scope.submitted = true;
                        });
                    });
            } else if ($scope.filter.selected === 'EARLY') {
                gapi.client.conference.getDaytimeNonWorkshopSessions().execute(function (resp) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            if (resp.error) {
                                // The request has failed.
                                var errorMessage = resp.error.message || '';
                                $scope.messages = 'Failed to query early sessions : ' + errorMessage;
                                $scope.alertStatus = 'warning';
                            } else {
                                // The request has succeeded.
                                $scope.submitted = false;
                                $scope.messages = 'Query succeeded ';
                                $scope.alertStatus = 'success';
                                $log.info($scope.messages);
        
                                $scope.sessions = [];
                                angular.forEach(resp.items, function (session) {
                                    $scope.sessions.push(session);
                                });
                            }
                            $scope.submitted = true;
                        });
                    });   
            } else {
                gapi.client.conference.getAllSessionsByType({
                        sessionType: $scope.filter.type,
                        websafeConferenceKey: $routeParams.websafeConferenceKey
                    }).execute(function (resp) {
                        $scope.$apply(function () {
                            $scope.loading = false;
                            if (resp.error) {
                                // The request has failed.
                                var errorMessage = resp.error.message || '';
                                $scope.messages = 'Failed to query sessions : ' + errorMessage;
                                $scope.alertStatus = 'warning';
                            } else {
                                // The request has succeeded.
                                $scope.submitted = false;
                                $scope.messages = 'Query succeeded ';
                                $scope.alertStatus = 'success';
                                $log.info($scope.messages);
        
                                $scope.sessions = [];
                                angular.forEach(resp.items, function (session) {
                                    $scope.sessions.push(session);
                                });
                            }
                            $scope.submitted = true;
                        });
                    });
            }
        } else {
            $scope.clearFilters();
        }
    };
});

/**
 * @ngdoc controller
 * @name RootCtrl
 *
 * @description
 * The root controller having a scope of the body element and methods used in the application wide
 * such as user authentications.
 *
 */
conferenceApp.controllers.controller('RootCtrl', function ($scope, $location, oauth2Provider, authStatus) {

    /**
     * Returns if the viewLocation is the currently viewed page.
     *
     * @param viewLocation
     * @returns {boolean} true if viewLocation is the currently viewed page. Returns false otherwise.
     */
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };

    /**
     * Returns the OAuth2 signedIn state.
     *
     * @returns {authStatus.signedIn|*} true if siendIn, false otherwise.
     */
    $scope.getSignedInState = function () {
        return authStatus.signedIn;
    };

    /**
     * Calls the OAuth2 authentication method.
     */
    $scope.signIn = function () {
        oauth2Provider.signIn(function () {
            gapi.client.oauth2.userinfo.get().execute(function (resp) {
                $scope.$apply(function () {
                    if (resp.email) {
                        authStatus.signedIn = true;
                        $scope.alertStatus = 'success';
                        $scope.rootMessages = 'Logged in with ' + resp.email;
                    }
                });
            });
        });
    };

    /**
     * Render the signInButton and restore the credential if it's stored in the cookie.
     * (Just calling this to restore the credential from the stored cookie. So hiding the signInButton immediately
     *  after the rendering)
     */
    $scope.initSignInButton = function () {
        gapi.signin.render('signInButton', {
            'callback': function () {
                jQuery('#signInButton button').attr('disabled', 'true').css('cursor', 'default');
                if (gapi.auth.getToken() && gapi.auth.getToken().access_token) {
                    $scope.$apply(function () {
                        authStatus.signedIn = true;
                    });
                }
            },
            'clientid': oauth2Provider.clientid,
            'cookiepolicy': 'single_host_origin',
            'scope': oauth2Provider.scope
        });
    };

    /**
     * Logs out the user.
     */
    $scope.signOut = function () {
        oauth2Provider.signOut();
        $scope.alertStatus = 'success';
        $scope.rootMessages = 'Logged out';
    };

    /**
     * Collapses the navbar on mobile devices.
     */
    $scope.collapseNavbar = function () {
        angular.element(document.querySelector('.navbar-collapse')).removeClass('in');
    };

});


