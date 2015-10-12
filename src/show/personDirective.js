'use strict';
// Person directive

var personDirective = function (){
  return {
      restrict: 'A',
      transclude: false,
      templateUrl: '/src/show/persontemplate.html',
      scope: {
          listperson: "=",
      },
      link: function(scope, elem, attrs) {
      }
      };
    };

module.exports = personDirective;
