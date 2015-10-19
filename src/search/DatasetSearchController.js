'use strict';

// @ngInject
var DatasetSearchController = function ($scope, $location, $controller, Dataset, npdcAppConfig, NpdcAutocompleteConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Dataset;
  npdcAppConfig.cardTitle = 'Search results';
  npdcAppConfig.onSearch = $scope.search;
    

  let defaults = { limit: "50", sort: "-updated,-released", fields: 'title,id,collection,updated', facets: "topics", score: true };
  let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes", "not-progress": "planned", "filter-links.rel": "data" };
  let query = Object.assign(defaults, params, invariants);

  $scope.search(query);

  NpdcAutocompleteConfig.selectedDefault = ['dataset'];
  NpdcAutocompleteConfig.placeholder = 'Search dataset catalogue';
  NpdcAutocompleteConfig.query = defaults;

};

module.exports = DatasetSearchController;
