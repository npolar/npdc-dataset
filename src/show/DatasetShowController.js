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
    let f = '';
    if (!d) { return; }
    if (d.doi) {
      f = d.doi.split('/')[1];
    } else {
      f = 'npolar.'+d.id.split('-')[0];
    }
    return `${ f }-data`;
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

  this.isAuthorized = (action='update') => {
    return NpolarApiSecurity.isAuthorized(action, $scope.resource.path);
  };

  this.isData = (d=$scope.document) => {
    if (!d) { return ; }
    if (d.attachments && d.attachments.length && d.attachments.length > 0) {
      return true;
    }
    return false;
  };

  this.isFilesMenu = (files=$scope.files, inembargo=self.isInEmbargo()) => {
    if (!files) {
      files = $scope.document.attachments;
    }
    const anyfiles = (files && files.length && files.length > 0);
    if (anyfiles && files.length === 1) {
      if (files[0].href === this.file_base()) {
        return false;
      }
    }
    if (inembargo) {
      return (self.isAuthorized('update') && anyfiles);
    } else {
      return anyfiles;
    }
  };


  this.isPointOfContact = (person) => {
    if (!person || !person.roles.length) { return; }
    return person.roles.includes('pointOfContact');
  };

  this.showDataset = function(dataset) {
    self.file_icon = 'file_download';
    if (dataset.released && (/^[0-9]{4}/).test(dataset.released)) {
      if (self.isInEmbargo(dataset.released)) {
        self.file_icon = 'lock';
      }
    }

    $scope.files = dataset.attachments;
    $http.get(self.file_base(dataset.id)).then(r => {
     let hashi = r.data;
     if (hashi.files && hashi.files.length > 0) {
       $scope.hashi_files_count = hashi.files.length;
       let restricted = hashi.files.find(f => f.restricted === true);
       if (restricted) {
         self.file_icon = 'lock';
       }
       //$scope.files = hashi.files.map(f => DatasetModel.linksFromHashi(f, dataset));
     }
    }, (error) => {

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

  self.showAction();

};

module.exports = DatasetShowController;
