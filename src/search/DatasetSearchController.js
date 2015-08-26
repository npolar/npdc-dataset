'use strict';
var angular = require('angular');
/**
 * @ngInject
 */
var DatasetSearchController = function ($scope, $location, $controller, Dataset) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Dataset;
    
  $scope.query = function() {
    var defaults = { limit: "all", sort: "-updated" };
    var invariants = { fields: 'title,id,updated' };
    return angular.extend(defaults, $location.search(), invariants);
  };

  $scope.search($scope.query());

};

module.exports = DatasetSearchController;
