'use strict';

function DatasetSearchController($scope, $controller, $filter, $location,
    NpolarApiSecurity,
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
    if (NpolarApiSecurity.isAuthenticated()) {
      delete query.fields;
    }
    return query;
  }

  function init() {
    $controller('NpolarBaseController', {
      $scope: $scope
    });

    $scope.resource = DatasetFactoryService.resourceFactory();
    $scope.model = DatasetModel;

    npdcAppConfig.search.local.results.title = (d) => d.title;
    if (NpolarApiSecurity.isAuthenticated()) {

      npdcAppConfig.search.local.results.subtitle = (d) => {
        let w = DatasetModel.warnings(d);
        console.debug(d.id, w);
        if (w.length > 0) {
          return w.length+'!';
        } else {
          return '';
        }
      };
    }

    // DatasetModel.warnings(dataset);
    npdcAppConfig.search.local.results.detail = function(entry) {
      return NpdcAPA.reference(NpdcCitationModel.authors(entry), NpdcCitationModel.year(entry));
    };

    // Show datasets with data link (only on first load, and only if not authenticated)
    if (!NpolarApiSecurity.isAuthenticated() && !$location.search().q  || $location.search().q === "") {
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
