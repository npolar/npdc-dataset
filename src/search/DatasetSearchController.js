'use strict';

// @ngInject
var DatasetSearchController = function ($scope, $location, $controller, Dataset, npdcAppConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Dataset;
  npdcAppConfig.cardTitle = 'Search results';
  npdcAppConfig.onSearch = $scope.search;

  let query = function(params) {
    let defaults = { limit: "all", sort: "-updated", fields: 'title,id,updated' };
    let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;
    return Object.assign(defaults, invariants, params);
  };

  $scope.search(query());

};

module.exports = DatasetSearchController;
