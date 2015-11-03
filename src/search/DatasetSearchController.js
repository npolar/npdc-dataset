'use strict';

// @ngInject
var DatasetSearchController = function ($scope, $location, $controller, Dataset, npdcAppConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Dataset;
  npdcAppConfig.cardTitle = 'Search';

  let defaults = { limit: "50", sort: "-updated,-released", fields: 'title,id,collection,updated', facets: "topics", score: true };
  let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes", "not-progress": "planned", "filter-links.rel": "data" };
  let query = Object.assign({}, defaults, invariants);

  let search = function (q) {
    $scope.search(Object.assign({}, query, q));
  };

  search(query);

  $scope.$on('$locationChangeSuccess', (event, data) => {
    search($location.search());
  });
};

module.exports = DatasetSearchController;
