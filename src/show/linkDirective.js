'use strict';
// Organisation directive

var linkDirective = function (){
  return {
      restrict: 'A',
      transclude: false,
      templateUrl: '/src/show/linktemplate.html',
      scope: {
          listlinks: "=",
          listrelated: "="
      },
      link: function(scope, elem, attrs) {
      }
      };
    };


module.exports = linkDirective;
