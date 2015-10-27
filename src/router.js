'use strict';

/**
 * @ngInject
 */
var router = function ($routeProvider, $locationProvider) {

  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider.when('/:id', {
  templateUrl: 'show/show-dataset.html',
  controller: 'DatasetShowController'
  }).when('/:id/edit', {
  template: '<npdc:formula></npdc:formula>',
  controller: 'DatasetEditController'
  }).when('/', {
  templateUrl: 'search/search.html',
  controller: 'DatasetSearchController',
  reloadOnSearch: false
  });
};

module.exports = router;
