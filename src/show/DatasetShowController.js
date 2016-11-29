'use strict';
let NpolarApiRequest = XMLHttpRequest;

var DatasetShowController = function($controller, $routeParams, $scope, $http, $q, $location, $mdDialog,
  NpolarTranslate, NpolarMessage, NpolarApiSecurity,
  npdcAppConfig,
  //NpdcWarningsService,
  DatasetFactoryService, DatasetModel, Project, Publication ) {
    'ngInject';

  $controller('NpolarBaseController', {
    $scope: $scope
  });
    
  $scope.resource = DatasetFactoryService.resourceFactory();
  $scope.model = DatasetModel;
  $scope.warnings = false;  
  $scope.notices = false;
  $scope.dataset = null;
  
  $scope.isPointOfContact = (person) => {
    if (!person || !person.roles.length) { return; }
    return person.roles.includes('pointOfContact');
  };
  
  

  

  let showDataset = function(dataset) {
    NpolarTranslate.dictionary['npdc.app.Title'] = DatasetModel.getAppTitle();
    
    //NpdcWarningsService.warnings[dataset.id] = DatasetModel.warnings(dataset);
    //NpdcWarningsService.notices[dataset.id] = DatasetModel.notices(dataset);
    
    $scope.uri = DatasetModel.uri(dataset);
    
    $scope.authors = DatasetModel.authors(dataset);
    $scope.publisher = (dataset.organisations||[]).find(o => (o.roles||[]).includes('publisher'));
    $scope.published_year = DatasetModel.published_year(dataset);
    $scope.citations = DatasetModel.citationList(dataset);
  
    $scope.isReleased = (/[0-9]{4}/.test($scope.published_year));
    
    $scope.bboxes = DatasetModel.bboxes(dataset);
    $scope.datespans = DatasetModel.datespans(dataset);
    $scope.relations = DatasetModel.relations(dataset); 
    $scope.related = DatasetModel.relations(dataset, ['related']);
    $scope.data = DatasetModel.relations(dataset, ['data','service']);
    
    
    // Grab Content-Length for stuff in the file API
    $scope.data.forEach((l,idx) => {
      if ((!l.length || !l.filename) && ((/^http(s)?:\/\//).test(l.href) && !(/[?&]q=/).test(l.href) && (/_file\/.+/).test(l.href))) {
        let request = new NpolarApiRequest(); //NpolarApiRequest.factory();
        request.head(request, l.href, (response) => {
          if (200 === request.status && response.lengthComputable) {  
            $scope.$apply(()=>{
              l.length = response.total; // same as parseInt(request.getResponseHeader('Content-Length');
              l.filename =  request.getResponseHeader('Content-Disposition').split('filename=')[1];
            });
          }
        });
      }
    });
    
    $scope.images = dataset.links.filter(l => { // @todo images in files ?
      return (/^image\/.*/).test(l.type);
    });
    
    $scope.mapOptions = {};

    if (dataset.coverage) {
      let bounds = dataset.coverage.map(cov => [[cov.south, cov.west], [cov.north, cov.east]]);
      $scope.mapOptions.coverage = bounds;
      $scope.mapOptions.geojson = "geojson";
    }
    //$scope.mapOptions.geometries = dataset.links.filter(l => (/application/(vnd[.])?geo\+json/).test(l.type)).map(l => l.href);
    
    $scope.metadata = DatasetModel.metadata(dataset, $scope.resource);
    
    // Find related documents
    if (!DatasetModel.isNyÅlesund()) {
      DatasetModel.suggestions(dataset, $scope.resource).then(suggestions => {
        $scope.suggestions = suggestions;
      });
    }    
  };

  let showAction = function() {
    
    // Check for DOI access eg. /dataset/10.21334/npolar.2016.664d3c4c
    let doi;
    
    if ($routeParams.suffix) {
      let cand = `${$routeParams.id}/${$routeParams.suffix}`;
      if (DatasetModel.isDoi(cand)) {
        doi = cand;
      }
    }
    
    if (doi) {
      $scope.resource.array({ 'filter-doi': doi, fields: 'id,doi', limit: 1 }).$promise.then((r) => {
        
        if (r && r.length === 1 && r[0].doi === doi) {
          $routeParams.id = r[0].id;
          $scope.show().$promise.then(dataset => {
            showDataset(dataset);
          });  
        } else {
         $scope.document = {};
         NpolarMessage.error(`Unknown DOI: ${doi}`);
        }
      });
      
    } else {
      $scope.show().$promise.then(dataset => {
        showDataset(dataset);
      });
    }
    


  };
  showAction();
  
};

module.exports = DatasetShowController;