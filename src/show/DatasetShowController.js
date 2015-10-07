'use strict';
/**
 *
 *
 * @ngInject
 */
var DatasetShowController = function ($anchorScroll, $controller, $location, $log, $routeParams, $scope, Dataset, Project, Publication, NpolarApiSecurity) {

  $controller('NpolarBaseController', {$scope: $scope});
  $scope.resource = Dataset;
  $scope.security = NpolarApiSecurity;

  $scope.related = {};

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
  var names = all_authors.map(a => { return a.hasOwnProperty("name") ? a.name : `${a.first_name[0]} ${a.last_name}`; });
  return names.join(", ")+et_al_suffix;
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
  let link = dataset.links.find(l => { return l.rel === "alternate" && (/html$/).test(l.type); });
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
  if (dataset.citation && dataset.citation !== "") {
    return dataset.citation;
  }

  let citation = `${ author_names(dataset) } (${ published_year(dataset) }). ${ dataset.title }. ${ publisher(dataset).map(p => { return p.name; }).join(", ")  }`;
  if (true || publisher.id === "npolar.no") {
    citation += ` (Tromsø, Norway): ${ uri(dataset) }`;
    //citation += ` (version ${ dataset._rev.split("-")[0] })`;
  }
  return citation;
  };

  $scope.orgName = function(id, organisations) {
  let org = (organisations||[]).find(o => o.id === id);
  return (org && org.name) ? org.name : id ;
  };

  $scope.gotoAnchor = function(id) {
  let old = $location.hash();
  $location.hash(id);
  $anchorScroll();
  $location.hash(old);
  };

  let show = function() {
  Dataset.fetch($routeParams, (dataset) => {

    //console.log("#", $location.hash());

    $scope.document = dataset;

    $scope.citation = citation(dataset);

    $scope.published_year = published_year(dataset);

    $scope.authors = authors(dataset).map(a => {
    if (false === a.hasOwnProperty("name") && a.hasOwnProperty("first_name")) {
      a.name = `${a.first_name} ${a.last_name}`;
    }
    return a;
    });

    $scope.links = dataset.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit") && l.rel !== "data");

    $scope.data = dataset.links.filter(l => l.rel === "data");

    $scope.alternate = dataset.links.filter(l => ( ( l.rel === "alternate" && l.type !== "text/html") || l.rel === "edit" ));

    if (typeof dataset.coverage != "undefined") {
        $scope.coverage = (JSON.stringify(dataset.coverage)).replace(/[{"\[\]}]/g, '');
    }

    if (typeof dataset.activity != "undefined") {
        $scope.activity = (JSON.stringify(dataset.activity)).replace(/[{"\[\]}]/g, '');
    }

    $scope.uri = uri(dataset);

    $scope.related.datasets = Dataset.array( { q: dataset.title, fields: 'id,title', score: true, limit: 20, 'not-id': dataset.id });

    $scope.related.publications = Publication.array( { q: dataset.title, fields: 'id,title,published_sort', score: true, limit: 20 });

    $scope.related.projects = Project.array( { q: dataset.title, fields: 'id,title', score: true, limit: 20 });

    $scope.isCCBy = dataset.licences.includes(l => {
      //$log.debug(l);
      return (/by/).test(l);
    });



  });

  };

  // http://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
  $scope.unescape = function(text) {
    return text;
    //var e = document.createElement('div');
    //e.innerHTML = text;
    //return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
  };


  show();

};

module.exports = DatasetShowController;