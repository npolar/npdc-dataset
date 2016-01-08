'use strict';
/**
 *
 *
 * @ngInject
 */
var DatasetShowController = function($controller, $routeParams,
  $scope, $q, Dataset, Project, Publication, npdcAppConfig) {

  $controller('NpolarBaseController', {
    $scope: $scope
  });
  $scope.resource = Dataset;

  let authors = (dataset) => {

    var folks = [];
    var orgs = [];

    if (dataset.people instanceof Array) {
      folks = dataset.people.filter(p => p.roles.includes("author"));
    }

    if (folks.length === 0 && dataset.organisations instanceof Array) {
      orgs = dataset.organisations.filter(o => o.roles.includes("author"));
    }
    return folks.concat(orgs);

  };

  let author_names = (dataset) => {
    var et_al_suffix = "";
    var all_authors = authors(dataset);
    if (all_authors.length > 5) {
      all_authors = [all_authors[0]];
      et_al_suffix = " et al";
    }
    var names = all_authors.map(a => {
      return a.hasOwnProperty("name") ? a.name : `${a.first_name[0]} ${a.last_name}`;
    });
    return names.join(", ") + et_al_suffix;
  };

  let published_year = (dataset) => {
    let y = "not-yet released";
    if ((/^\d{4}\-/).test(dataset.released)) {
      y = new Date(dataset.released).getFullYear();
    }
    return y;
  };

  let publisher = (dataset) => {
    let p = dataset.organisations.filter(o => o.roles.includes("publisher"));

    if (p.length > 0) {
      return p;
    } else {
      return [];
    }
  };

  let uri = (dataset) => {
    let link = dataset.links.find(l => {
      return l.rel === "alternate" && (/html$/).test(l.type);
    });
    if (link) {
      return link.href.replace(/^http:/, "https:");
    } else {
      return `https://data.npolar.no/dataset/${ dataset.id }`;
    }
  };

  // Citation string
  // Adapted from https://github.com/npolar/data.npolar.no/blob/0094e7f2f690f02524543b132b4f7fb3cc89a7e3/modules/app/dataArchive/model/dataset.rb
  let citation = (dataset) => {

    // Fixed citation, e.g. /dataset/816e992b-63ff-41b5-85b9-b3258a55b31b
    if (dataset.citation) {
      return dataset.citation;
    }

    let citation = `${ author_names(dataset) } (${ published_year(dataset) }). ${ dataset.title }. ${ publisher(dataset).map(p => { return p.name; }).join(", ")  }`;
    if (true || publisher.id === "npolar.no") {
      citation += ` (Tromsø, Norway): ${ uri(dataset) }`;
    }
    return citation;
  };

  let show = function() {
    $scope.show().$promise.then((dataset) => {
      npdcAppConfig.cardTitle = $scope.document.title;
      $scope.citation = citation(dataset);

      $scope.published_year = published_year(dataset);
      $scope.links = dataset.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit") && l.rel !== "data");
      $scope.data = dataset.links.filter(l => l.rel === "data");
      $scope.alternate = dataset.links.filter(l => ((l.rel === "alternate" && l.type !== "text/html") || l.rel === "edit"));
      $scope.mapOptions = { coverage: dataset.coverage };

      $scope.authors = authors(dataset).map(a => {
        if (!a.name && a.first_name) {
          a.name = `${a.first_name} ${a.last_name}`;
        }
        return a;
      });

      if (dataset.coverage) {
        $scope.coverage = (JSON.stringify(dataset.coverage)).replace(/[{"\[\]}]/g, '');
      }

      $scope.uri = uri(dataset);

      let relatedDatasets = Dataset.array({
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

    });

  };


  show();
};

module.exports = DatasetShowController;
