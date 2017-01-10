'use strict';

function DatasetSearchController($scope, $controller, $filter, $location,
    DatasetFactoryService, DatasetModel, NpdcCitationModel, NpdcAPA, npdcAppConfig, NpdcAutocompleteConfigFactory,
    NpdcSearchService, NpolarTranslate) {
  'ngInject';

  function query() {
    let param = $location.search();

    let sort = param.sort || null;

    let query =  {
      limit: param.limit||20,
      fields: 'title,id,collection,updated,released,links,people,organisations',
      facets: "sets,topics,links.rel,people.email,created_by,updated_by",
      sort,
      score: true
    };

    console.log('query', query);
    return query;
  }

  function init() {
    $controller('NpolarBaseController', {
      $scope: $scope
    });

    $scope.resource = DatasetFactoryService.resourceFactory();
    $scope.model = DatasetModel;

    npdcAppConfig.search.local.results.title = (d) => d.title;
    npdcAppConfig.search.local.results.detail = function(entry) {
      return NpdcAPA.reference(NpdcCitationModel.authors(entry), NpdcCitationModel.year(entry));
    };

    // Show datasets with data link (on first load)
    if (!$location.search().q  || $location.search().q === "") {
      $location.search(Object.assign({}, $location.search(), { 'filter-links.rel': 'data' }));
    }

    $scope.$on('$locationChangeSuccess', (event, data) => {
      $scope.search(query());
    });
  }

  init();

  $scope.search(query()).$promise.then(r => {
    NpolarTranslate.dictionary['npdc.app.Title'] = DatasetModel.getAppTitle();
  });

}
module.exports = DatasetSearchController;
