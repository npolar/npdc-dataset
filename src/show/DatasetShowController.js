'use strict';

var DatasetShowController = function($controller, $routeParams, $scope, $q,
  NpolarTranslate,npdcAppConfig,
  DatasetFactoryService, DatasetModel, Project, Publication ) {
    'ngInject';

  $controller('NpolarBaseController', {
    $scope: $scope
  });
  
  $scope.resource = DatasetFactoryService.resourceFactory();

  let show = function() {
    $scope.show().$promise.then((dataset) => {
      
      NpolarTranslate.dictionary['npdc.app.Title'] = DatasetModel.getAppTitle();  
      if (!dataset.links) {
        dataset.links = [];
      }
      $scope.citation = DatasetModel.citation(dataset);
      $scope.publisher = DatasetModel.publisher(dataset);
      $scope.published_year = DatasetModel.published_year(dataset);
      $scope.links = dataset.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit") && l.rel !== "data" && l.rel !== "via");
      $scope.data = dataset.links.filter(l => l.rel === "data");
      $scope.images = dataset.links.filter(l => {
        return (/^image\/.*/).test(l.type);
      });
      // @todo images in files ?
      
      if (DatasetModel.isNyÅlesund) {
        $scope.alternate = false;
      } else {
        $scope.alternate = dataset.links.filter(l => ((l.rel === "alternate" && l.type !== "text/html") || l.rel === "edit")).concat({
          href: `http://api.npolar.no/dataset/?q=&filter-id=${dataset.id}&format=json&variant=ld`,
          title: "DCAT (JSON-LD)",
          type: "application/ld+json"
        });
      }

      $scope.mapOptions = {};

      if (dataset.coverage) {
        let bounds = dataset.coverage.map(cov => [[cov.south, cov.west], [cov.north, cov.east]]);
        $scope.mapOptions.coverage = bounds;
        $scope.mapOptions.geojson = "geojson";
      }
      $scope.mapOptions.geometries = dataset.links.filter(l => l.type === "application/vnd.geo+json").map(l => l.href);
      
      
      $scope.authors = DatasetModel.authors(dataset).map(a => {
        if (!a.name && a.first_name) {
          a.name = `${a.first_name} ${a.last_name}`;
        }
        return a;
      });

      if (dataset.coverage) {
        $scope.coverage = (JSON.stringify(dataset.coverage)).replace(/[{"\[\]}]/g, '');
      }

      $scope.uri = DatasetModel.uri(dataset);
      
      
      // Set related, but not for Ny-Ålesund datasets
      if (!DatasetModel.isNyÅlesund()) {
      
      
        let relatedDatasets = $scope.resource.array({
          q: dataset.title,
          fields: 'id,title,collection',
          score: true,
          limit: 5,
          'not-id': dataset.id,
          op: 'OR'
        }).$promise;
        let relatedPublications = Publication.array({
          q: dataset.title,
          fields: 'id,title,published_sort,collection',
          score: true,
          limit: 5,
          op: 'OR'
        }).$promise;
        let relatedProjects = Project.array({
          q: dataset.title,
          fields: 'id,title,collection',
          score: true,
          limit: 5,
          op: 'OR'
        }).$promise;
  
        $q.all([relatedDatasets, relatedPublications, relatedProjects]).then(related => {
          $scope.related = related;
        });
      }

    });

  };
  
  show();
  
};

module.exports = DatasetShowController;