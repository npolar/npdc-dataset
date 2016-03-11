'use strict';

var DatasetSearchController = function($scope, $location, $controller, $filter, Dataset, npdcAppConfig, NpolarTranslate) {
  'ngInject';

  $controller('NpolarBaseController', {
    $scope: $scope
  });
  $scope.resource = Dataset;

  npdcAppConfig.search.local.results.detail = function(entry) {
    return NpolarTranslate.translate("Released: ") + (entry.released ? $filter('date')(entry.released.split('T')[0]) : '-');
  };

  let query = function() {
    let defaults = {
      limit: "50",
      sort: "-updated,-released",
      fields: 'title,id,collection,updated,released',
      facets: "topics,tags,people.email,organisation.name",
      score: true
    };
    let invariants = $scope.security.isAuthenticated() ? {} : {
      "not-draft": "yes",
      "not-progress": "planned",
      "filter-links.rel": "data"
    };
    return Object.assign({}, defaults, invariants);
  };

  $scope.search(query());

  $scope.$on('$locationChangeSuccess', (event, data) => {
    $scope.search(query());
  });

};

module.exports = DatasetSearchController;
