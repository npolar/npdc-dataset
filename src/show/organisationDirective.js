'use strict';
// Organisation directive

var organisationDirective = function (){
  return {
      restrict: 'A',
      transclude: false,
      templateUrl: '/src/show/organisationtemplate.html',
      scope: {
          listorganisation: "=",
      },
      link: function(scope, elem, attrs) {
      }
      };
    };

module.exports = organisationDirective;
