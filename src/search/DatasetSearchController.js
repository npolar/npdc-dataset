'use strict';

function DatasetSearchController($scope, $controller, $filter, $location,
    DatasetFactoryService, DatasetModel, NpdcCitationModel, NpdcAPA, npdcAppConfig, NpdcAutocompleteConfigFactory,
    NpdcSearchService, NpolarTranslate) {
  'ngInject';

  function query() {

    let query =  {
      limit: $location.search().limit||50,
      fields: 'title,id,collection,updated,released,links,version,people,organisations',
      facets: "sets,topics,tags,links.rel,people.email,organisation.name",
      score: true
    };

    if (!$location.search().q  || $location.search().q === "") {
      query.sort = '-updated';
    }

    if (DatasetModel.isNyÅlesund()) {
      query['not-organisations.id'] = 'npolar.no';
      query['not-organisations.name'] = 'Norwegian Polar Institute';
      query['not-organisations.name'] = 'Norsk Polarinstitt';

    }
    return query;
  }

  function init() {
    $controller('NpolarBaseController', {
      $scope: $scope
    });

    $scope.resource = DatasetFactoryService.resourceFactory();
    $scope.model = DatasetModel;

    console.log(npdcAppConfig.search.local);
    npdcAppConfig.search.local.results.title = (d) => d.title;
    npdcAppConfig.search.local.results.detail = function(entry) {
      return NpdcAPA.reference(NpdcCitationModel.authors(entry), NpdcCitationModel.year(entry));
    };

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
