'use strict';

// @ngInject
var DatasetSearchController = function ($scope, $location, $controller, Dataset, npdcAppConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Dataset;
  npdcAppConfig.cardTitle = 'Search results';


  let defaults = { limit: "50", sort: "-updated,-released", fields: 'title,id,collection,updated', facets: "topics", score: true };
  let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes", "not-progress": "planned", "filter-links.rel": "data" };
  let query = Object.assign(defaults, invariants);

  let search = function(q) {
    return $scope.search(q).$promise.then(data => {
      npdcAppConfig.search.facets = data.feed.facets;
    });
  };

  search(query);

};

module.exports = DatasetSearchController;
