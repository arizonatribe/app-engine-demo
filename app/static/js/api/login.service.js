(function(angular) {
  'use strict';

  angular.module('confApp.api')
    .factory('loginService', LoginService);

  function LoginService(gapi, $q, statusService, $modalInstance, gapiSettings, authStatus) {
    var getUserInfo = function() {
          var deferred = $q.defer();

          gapi.client.oauth2.userinfo.get().execute(function (resp) {
            if ($modalInstance && $modalInstance.close) $modalInstance.close();
            if (resp.email) {
              authStatus.signedIn = true;
              $scope.rootMessages = 'Logged in with ' + resp.email;
              deferred.resolve(statusService.handleSuccess('Logged in with ' + resp.email));
            } else {
              deferred.reject(statusService.handleError({message: 'Unable to retrieve user email'}, 'login', resp));
            }
          });

          return deferred.promise;
        },
        renderSignIn = function() {
          return gapi.signin.render('signInButton', {
            'callback': function () {
              jQuery('#signInButton button')
                .attr('disabled', 'true')
                .css('cursor', 'default');

              if (gapi.auth.getToken() && gapi.auth.getToken().access_token) {
                $scope.$apply(function () {
                    authStatus.signedIn = true;
                });
              }
            },
            'clientid': gapiSettings.clientid,
            'cookiepolicy': gapiSettings.cookiepolicy,
            'scope': gapiSettings.scope
          });
        };

    return {
      getUserInfo: getUserInfo,
      renderSignIn: renderSignIn
    };
  }
})(window.angular);