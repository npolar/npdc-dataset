'use strict';

var router = function($routeProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider.when('/ny-ålesund/:id', {
    templateUrl: 'show/show-dataset.html',
    controller: 'DatasetShowController'
  }).when('/ny-ålesund/:id/edit', {
    template: '<npdc:formula></npdc:formula>',
    controller: 'DatasetEditController'
  }).when('/ny-ålesund/', {
    templateUrl: 'search/search.html',
    controller: 'DatasetSearchController',
    reloadOnSearch: false,
  }).when('/ny-alesund/', {
    redirectTo: '/ny-ålesund',
  }).when('/:id/edit', {
    templateUrl: 'edit/edit-dataset.html',
    controller: 'DatasetEditController'
  }).when('/:id/:suffix?', {
    templateUrl: 'show/show-dataset.html',
    controller: 'DatasetShowController'
  }).when('/', {
    templateUrl: 'search/search.html',
    controller: 'DatasetSearchController',
    reloadOnSearch: false
  });
};

module.exports = router;
