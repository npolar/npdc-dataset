'use strict';

function DatasetSearchController($scope, $controller, $filter, $location,
    DatasetFactoryService, DatasetModel, npdcAppConfig, NpdcAutocompleteConfigFactory,
    NpdcSearchService, NpolarTranslate) {
  'ngInject';

  function query() {

    let query =  {
      limit: $location.search().limit||50,
      fields: 'title,id,collection,updated,released,links',
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

    npdcAppConfig.search.local.results.detail = function(entry) {
      let releasedText = NpolarTranslate.translate('dataset.Released');
      let r = releasedText +': '+ (entry.released ? $filter('year')(entry.released) : '-');
      //let warnings = DatasetModel.warnings(entry);
      let warning = '';
      //if (warnings[0]) {
      //  warning = ' [!]';
      //}
      return r+warning;
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
