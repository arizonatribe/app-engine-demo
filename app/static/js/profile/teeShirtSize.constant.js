(function(angular) {
  'use strict';

  angular.module('confApp.profile')
    .constant('TeeShirtSize', [
      {'size': 'XS_M', 'text': 'XS - Men\'s'},
      {'size': 'XS_W', 'text': 'XS - Women\'s'},
      {'size': 'S_M', 'text': 'S - Men\'s'},
      {'size': 'S_W', 'text': 'S - Women\'s'},
      {'size': 'M_M', 'text': 'M - Men\'s'},
      {'size': 'M_W', 'text': 'M - Women\'s'},
      {'size': 'L_M', 'text': 'L - Men\'s'},
      {'size': 'L_W', 'text': 'L - Women\'s'},
      {'size': 'XL_M', 'text': 'XL - Men\'s'},
      {'size': 'XL_W', 'text': 'XL - Women\'s'},
      {'size': 'XXL_M', 'text': 'XXL - Men\'s'},
      {'size': 'XXL_W', 'text': 'XXL - Women\'s'},
      {'size': 'XXXL_M', 'text': 'XXXL - Men\'s'},
      {'size': 'XXXL_W', 'text': 'XXXL - Women\'s'}
    ]);
})(window.angular);