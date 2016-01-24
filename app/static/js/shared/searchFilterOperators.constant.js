(function(angular) {
  'use strict';
  
  angular.module('confApp.shared')
    .constant('searchFilterOperators', [
      {displayName: '=', enumValue: 'EQ'},
      {displayName: '>', enumValue: 'GT'},
      {displayName: '>=', enumValue: 'GTEQ'},
      {displayName: '<', enumValue: 'LT'},
      {displayName: '<=', enumValue: 'LTEQ'},
      {displayName: '!=', enumValue: 'NE'}
    ]);
})(window.angular);