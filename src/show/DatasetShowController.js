'use strict';
var DatasetShowController = function($controller, $routeParams, $scope, $http, $q, $location, $mdDialog,
  NpolarTranslate, NpolarMessage, NpolarApiSecurity,
  npdcAppConfig, NpdcCitationModel, NpdcDOI,
  NpdcWarningsService,
  DatasetFactoryService, DatasetModel, DatasetCitation, Project, Publication ) {
    'ngInject';

  $controller('NpolarBaseController', {
    $scope: $scope
  });

  let self = this;

  $scope.resource = DatasetFactoryService.resourceFactory();
  $scope.model = DatasetModel;
  $scope.warnings = false;
  $scope.notices = false;
  $scope.dataset = null;
  $scope.files = [];

  this.file_all_filename = (d) => {
    if (!d) { return; }
    return `${ d.doi.split('/')[1] || 'npolar.'+d.id.split('-')[0] }-data`;
  };

  this.file_base = (id=$routeParams.id) => DatasetModel.file_server(NpolarApiSecurity.canonicalUri($scope.resource.path)).replace('/:id/', `/${id}/`);

  this.file_all = (d, filename=self.file_all_filename(d), format='zip') => {
    if (!d) { return; }
    return self.file_href_with_key(self.file_base(d.id)+`/_all/?filename=${filename}&format=zip`, '&');
  };
  
  this.file_href_with_key = (href, sep='?') => {
    let system = NpolarApiSecurity.getSystem('read', $scope.resource.path);
    if (system && system['key']) {
      href += sep+'key='+system['key'];
    }
    return href;
  };
  
  this.isInEmbargo = (released=$scope.document.released) => {
    return (Date.parse(released) > new Date().getTime());
  };
  //this.releaseNow = (files=$scope.files, resource=$scope.resource, id=$routeParams.id) => {
  //  console.log('Releasing dataset');
  //  if (files && files.length > 0) {
  //    resource.unprotectFiles(files);
  //  }
  //  let uri = `${NpolarApiSecurity.canonicalUri(resource.path)}/${id}`;
  //  $http.get(uri).then(r => {
  //    let d = r.data;
  //    // if d.release is in the future, set now
  //    //d.released = new Date().toISOString();
  //    // $http.put(uri, d);
  //  });
  //};
  
  this.protectFiles = (files=$scope.files, resource=$scope.resource) => {
    console.log('Protecting files');
    resource.setRestrictedStatusForFiles(files, true);
  };
  
  this.unprotectFiles = (files=$scope.files, resource=$scope.resource) => {
    console.log('Unlocking files');
    resource.setRestrictedStatusForFiles(files, false);
  };
  
  this.isWriter = () => {
    return NpolarApiSecurity.isAuthorized('update', $scope.resource.path);
  };

  this.isPointOfContact = (person) => {
    if (!person || !person.roles.length) { return; }
    return person.roles.includes('pointOfContact');
  };

  this.showDataset = function(dataset) {
    self.file_icon = 'file_download';
    $http.get(self.file_base(dataset.id)).then(r => {
      let hashi = r.data;
      if (hashi.files && hashi.files.length > 0) {
        
        let restricted = hashi.files.find(f => f.restricted === true);
        if (restricted) {
          self.file_icon = 'lock';
        } 
        $scope.files = hashi.files.map(f => DatasetModel.linksFromHashi(f, dataset));
      }
    }, (error) => {
      $scope.files = dataset.attachments;
      self.file_icon = 'error';
      $scope.file_error = error;
    });
    NpolarTranslate.dictionary['npdc.app.Title'] = DatasetModel.getAppTitle();

    NpdcWarningsService.warnings[dataset.id] = DatasetModel.warnings(dataset);
    NpdcWarningsService.notices[dataset.id] = DatasetModel.notices(dataset);

    $scope.uri = DatasetCitation.uri(dataset);
    $scope.authors = NpdcCitationModel.authors(dataset);
    $scope.publisher = (dataset.organisations||[]).find(o => (o.roles||[]).includes('publisher'));
    $scope.published_year = DatasetModel.published_year(dataset);
    $scope.citations = DatasetCitation.citationList(dataset);

    $scope.isReleased = (/[0-9]{4}/.test($scope.published_year));

    $scope.bboxes = DatasetModel.bboxes(dataset);
    $scope.datespans = DatasetModel.datespans(dataset);

    $scope.relations = DatasetModel.relations(dataset);
    $scope.links = $scope.related = DatasetModel.relations(dataset, ['related', 'metadata']);

    // Set data links (but reject those in the _file API)
    $scope.data_links = DatasetModel.relations(dataset, ['data']).filter(l => {
      let re = new RegExp(self.file_base());
      return !re.test(l.href);
    });

    $scope.service_links = DatasetModel.relations(dataset, ['service']).filter(l => {
      return (null === $scope.data_links.find(dl => dl.href === l.href));
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
    // @todo Magic GeoJSON / CoverageJSON integration
    //$scope.mapOptions.geometries = dataset.links.filter(l => (/application/(vnd[.])?geo\+json/).test(l.type)).map(l => l.href);

    $scope.metadata = DatasetModel.metadata(dataset, $scope.resource, $scope.uri);

    // Find related documents
    if (!DatasetModel.isNyÅlesund()) {
      DatasetModel.suggestions(dataset, $scope.resource).then(suggestions => {
        $scope.suggestions = suggestions;
      });
    }
  };

  this.showAction = () => {
    $scope.show().$promise.then(dataset => {
      self.showDataset(dataset);
    });
  };
  
  //if (!$scope.document) {
    self.showAction();
  //}
  
};

module.exports = DatasetShowController;