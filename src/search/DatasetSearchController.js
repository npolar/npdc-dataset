'use strict';

var DatasetSearchController = function($scope, $controller, $filter,
    DatasetFactoryService, DatasetModel, npdcAppConfig,
    NpdcSearchService, NpolarTranslate) {
  'ngInject';

  function init() {
    $controller('NpolarBaseController', {
      $scope: $scope
    });
    $scope.resource = DatasetFactoryService.resourceFactory();
    
    $scope.query = function() {
      let query =  {
        limit: "50",
        sort: "-updated,-released",
        fields: 'title,id,collection,updated,released,links.rel',
        facets: "sets,topics,tags,links.rel,people.email,organisation.name",
        score: true
      };
      if (DatasetModel.isNyÅlesund()) {
        query['not-organisations.id'] = 'npolar.no';
        query['not-organisations.name'] = 'Norwegian Polar Institute';
        query['not-organisations.name'] = 'Norsk Polarinstitt';
        
      }
      return query;
    };
    
    npdcAppConfig.search.local.results.detail = function(entry) {
      let releasedText = NpolarTranslate.translate('dataset.Released');
      let updatedText = NpolarTranslate.translate("Updated");
      //let metadataUpdated = NpolarTranslate.translate("Metadata") +' '+ updatedText;
      
      let r = releasedText +': '+ (entry.released ? $filter('date')(entry.released.split('T')[0]) : '-');
      return r+` . Metadata ${updatedText} ${$filter('date')(entry.updated)}`;
    };
    
    $scope.$on('$locationChangeSuccess', (event, data) => {
      $scope.search($scope.query());
    });  
  } 
  
  init();
  
  $scope.search($scope.query()).$promise.then(r => {
    NpolarTranslate.dictionary['npdc.app.Title'] = DatasetModel.getAppTitle();  
  });
  
};

module.exports = DatasetSearchController;