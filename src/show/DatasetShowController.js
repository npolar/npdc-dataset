'use strict';
/**
 * Adapted from https://github.com/npolar/data.npolar.no/blob/0094e7f2f690f02524543b132b4f7fb3cc89a7e3/modules/app/dataArchive/model/dataset.rb  
 *
 * @ngInject
 */
var DatasetShowController = function ($scope, $controller, $routeParams, Dataset, NpolarApiSecurity) {
  
  $controller('NpolarBaseController', {$scope: $scope});
  $scope.resource = Dataset;
  $scope.security = NpolarApiSecurity;
   
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
  
  let show = function() {
    Dataset.fetch($routeParams, (document) => {
       console.log("DatasetShowController");
 
      $scope.document = document;
      $scope.citation = author_names(document);
    });
    
  };
  
  show();
  
};

module.exports = DatasetShowController;