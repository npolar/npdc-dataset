'use strict';

var DatasetSearchController = function($scope, $controller, $filter, Dataset, npdcAppConfig,
    NpdcSearchService, NpolarTranslate) {
  'ngInject';

  let mapBounds;
  $controller('NpolarBaseController', {
    $scope: $scope
  });
  $scope.resource = Dataset;
  
  npdcAppConfig.search.local.results.detail = function(entry) {
    let releasedText = NpolarTranslate.translate('dataset.Released');
    let updatedText = NpolarTranslate.translate("Updated");
    let metadataUpdated = NpolarTranslate.translate("Metadata") +' '+ updatedText;
    
    let r = releasedText +': '+ (entry.released ? $filter('date')(entry.released.split('T')[0]) : '-');
    return r+` . Metadata ${updatedText} ${$filter('date')(entry.updated)}`;
  };

  let query = function() {
    return {
      limit: "50",
      sort: "-updated,-released",
      fields: 'title,id,collection,updated,released,links.rel',
      facets: "sets,topics,tags,links.rel,people.email,organisation.name",
      score: true
    };
  };
  $scope.search(query());

  $scope.$on('$locationChangeSuccess', (event, data) => {
    $scope.search(query());
  });
};

module.exports = DatasetSearchController;