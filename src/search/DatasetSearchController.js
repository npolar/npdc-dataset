'use strict';

// @ngInject
var DatasetSearchController = function ($scope, $location, $controller, Dataset, npdcAppConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Dataset;
  npdcAppConfig.cardTitle = 'Datasets';
  npdcAppConfig.search.local.results.detail = function (entry) {
    return "Released: " + (entry.released ? entry.released.split('T')[0] : '-');
  };

  let query = function() {
    let defaults = { limit: "50", sort: "-updated,-released", fields: 'title,id,collection,updated,released', facets: "topics", score: true };
    let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes", "not-progress": "planned", "filter-links.rel": "data" };
    return Object.assign({}, defaults, invariants);
  };

  $scope.search(query());

  $scope.$on('$locationChangeSuccess', (event, data) => {
    $scope.search(query());
  });

};

module.exports = DatasetSearchController;
