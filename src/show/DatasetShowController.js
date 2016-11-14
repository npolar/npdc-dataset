'use strict';

var DatasetShowController = function($controller, $routeParams, $scope, $http, $q, $location,
  NpolarTranslate, NpolarMessage, NpolarApiSecurity,
  npdcAppConfig,
  DatasetFactoryService, DatasetModel, Project, Publication ) {
    'ngInject';

  $controller('NpolarBaseController', {
    $scope: $scope
  });
    
  $scope.resource = DatasetFactoryService.resourceFactory();
  $scope.model = DatasetModel;
  $scope.warning = false;  
  $scope.authors = [];
  
  $scope.citationClicked = function(link) {
    
    if (link.text) {
      $scope.citation = link;
    } else if (link.href) {
      $scope.citation = link;
        $http.get(link.href).then(r => {
          $scope.citation.text = r.data;  
      });
    }
  };
  
  // @todo find inbound links ie publications linking to this dataset
  let showDataset = function(dataset) {
    NpolarTranslate.dictionary['npdc.app.Title'] = DatasetModel.getAppTitle();
    
    $scope.warnings = DatasetModel.warnings(dataset);
    
    if (!dataset.links) {
      dataset.links = [];
    }
    $scope.citations = DatasetModel.citationList(dataset);
    $scope.citation = $scope.citations[0];
    
    $scope.authors = DatasetModel.authors(dataset);
    $scope.publisher = dataset.organisations.find(o => o.roles.includes('publisher'));
    $scope.published_year = DatasetModel.published_year(dataset);
    
    $scope.isReleased = (/[0-9]{4}/.test($scope.published_year));
    
    $scope.bboxes = (dataset.coverage||[]).map(c => [c.west, c.south, c.east, c.north]);
    $scope.timespans = (dataset.activity||[]).map(c => {
      let ts = [];
        ts[0] = (/T/).test(c.start) ? c.start.split('T')[0] : '' ;
        ts[1] = (/T/).test(c.stop) ? c.stop.split('T')[0] : '' ;
        return ts;
      }
    );
    
    $scope.links = dataset.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit") && l.rel !== "data" && l.rel !== "via");
    $scope.data = dataset.links.filter(l => ['data','service'].includes(l.rel));
    
    $scope.alternate = dataset.links.filter(l => (l.rel === "alternate" || l.rel === "edit") && l.type !== 'text/html').map(l => {
      if (l.rel === 'edit') {
        l.title = "JSON";
      }
      return l;
    });
    
    if (!DatasetModel.isNyÅlesund(dataset)) {
      $scope.alternate.push({
        href: `//api.npolar.no/dataset/?q=&filter-id=${dataset.id}&format=json&variant=ld`,
        title: 'DCAT (JSON-LD)',
        type: 'application/ld+json'
      });
      if (DatasetModel.isDoi(dataset.doi)) {
        $scope.alternate.push({
          href: `//data.datacite.org/application/vnd.datacite.datacite+xml/${dataset.doi}`,
          title: 'Datacite XML',
          type: 'vnd.datacite.datacite+xml'
        });
      }
    }
    
    // Grab Content-Length for stuff in the file API
    $scope.data.forEach((l,idx) => {
      if ((!l.length || !l.filename) && (/^https:\/\/api\.npolar\.no\/.+\/\/_file\//).test(l.href)) {
        let request = new XMLHttpRequest();
        request.addEventListener('load', response => {
          if (200 === request.status && response.lengthComputable) {  
            $scope.$apply(()=>{
              l.length = response.total; // same as parseInt(request.getResponseHeader('Content-Length');
              l.filename =  request.getResponseHeader('Content-Disposition').split('filename=')[1];
            });
          }
        });
        request.open('HEAD', l.href);
        request.setRequestHeader('Authorization', NpolarApiSecurity.authorization());
        request.send();    
      }
    });
    
    $scope.images = dataset.links.filter(l => { // @todo images in files ?
      return (/^image\/.*/).test(l.type);
    });
    
    $scope.citationList = DatasetModel.citationList(dataset);
    
    $scope.mapOptions = {};

    if (dataset.coverage) {
      let bounds = dataset.coverage.map(cov => [[cov.south, cov.west], [cov.north, cov.east]]);
      $scope.mapOptions.coverage = bounds;
      $scope.mapOptions.geojson = "geojson";
    }
    //$scope.mapOptions.geometries = dataset.links.filter(l => (/application/(vnd[.])?geo\+json/).test(l.type)).map(l => l.href);
    
    if (dataset.coverage) {
      $scope.coverage = (JSON.stringify(dataset.coverage)).replace(/[{"\[\]}]/g, '');
    }

    $scope.uri = DatasetModel.uri(dataset); // URI to doi.org | data.npolar.no
    
    
    // Find related documents
    if (!DatasetModel.isNyÅlesund()) {
      DatasetModel.findRelated(dataset, $scope.resource).then(related => {
        $scope.related = related;
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