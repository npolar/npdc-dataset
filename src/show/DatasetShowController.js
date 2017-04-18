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

  this.file_all_filename = (d) => `${ d.doi.split('/')[1] || 'npolar.'+d.id.split('-')[0] }-data`;

  this.file_base = (id=$routeParams.id) => DatasetModel.file_server(NpolarApiSecurity.canonicalUri($scope.resource.path)).replace('/:id/', `/${id}/`);

  this.file_all = (d, filename=self.file_all_filename(d), format='zip') => {
    return self.file_base(d.id)+`/_all/?filename=${filename}&format=zip`;
  };

  $scope.isPointOfContact = (person) => {
    if (!person || !person.roles.length) { return; }
    return person.roles.includes('pointOfContact');
  };

  let showDataset = function(dataset) {

    $http.get(self.file_base(dataset.id)).then(r => {
      let hashi = r.data;
      if (hashi.files && hashi.files.length > 0) {
        $scope.files = hashi.files.map(f => DatasetModel.linksFromHashi(f, dataset));
      }
    }, (error) => {
      $scope.files = dataset.attachments;
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

    $scope.data_links = DatasetModel.relations(dataset, ['data']).filter(l => {
      let re = new RegExp(self.file_base());
      return !re.test(l.href) && !(/api\.npolar\.no/).test(l.href);
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

  let showAction = function() {

    // Check for DOI access eg. /dataset/10.21334/npolar.2016.664d3c4c
    let doi;

    if ($routeParams.suffix) {
      let cand = `${$routeParams.id}/${$routeParams.suffix}`;
      if (NpdcDOI.isDoi(cand)) {
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
