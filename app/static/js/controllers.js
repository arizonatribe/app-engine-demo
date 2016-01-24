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


