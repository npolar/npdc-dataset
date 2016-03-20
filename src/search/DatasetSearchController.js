'use strict';

var DatasetSearchController = function($scope, $controller, $filter, Dataset, npdcAppConfig,
    NpdcSearchService, NpolarTranslate) {
  'ngInject';

  let mapBounds;
  $controller('NpolarBaseController', {
    $scope: $scope
  });
  $scope.resource = Dataset;
  $scope.tabs = [
    {
      title: 'Map',
      active: true,
    },
    {
      title: 'List'
    }
  ];

  let setPoints = function(bounds) {
    Dataset.geoQuery(bounds).then(points => {
      $scope.mapOptions.points = points;
    });
  };

  $scope.tabActivate = function (tab) {
    if ($scope.tabs[0].active && mapBounds) {
      setPoints(mapBounds);
    }
  };

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
    if ($scope.tabs[0].active && mapBounds) {
      setPoints(mapBounds);
    }
  });

  $scope.mapOptions = {};
  $scope.$on('map:move', (e, bounds) => {
    mapBounds = bounds;
    setPoints(bounds);
  });
};

module.exports = DatasetSearchController;
