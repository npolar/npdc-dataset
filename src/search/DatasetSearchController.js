'use strict';
var angular = require('angular');
/**
 * @ngInject
 */
var DatasetSearchController = function ($scope, $location, $controller, Dataset) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Dataset;
    
  $scope.query = function() {
    
    let defaults = { limit: "all", sort: "-updated", fields: 'title,id,updated' };
    let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;
    
    return angular.extend(defaults, $location.search(), invariants);
  };

  $scope.search($scope.query());

};

module.exports = DatasetSearchController;
