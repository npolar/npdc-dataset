'use strict';
// Top: citation directive

var citationDirective = function (){
  return {
      restrict: 'A',
      templateUrl: 'show/citationtemplate.html',
      link: function(scope, elem, attrs) {
          scope.citation = scope.citation;
      }
      };
    };


module.exports = citationDirective;
