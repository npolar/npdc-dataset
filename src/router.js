'use strict';

/**
 * @ngInject
 */
var router = function ($routeProvider, $locationProvider) {

  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider.when('/:id', {
    templateUrl: 'show/show.html',
    controller: 'DatasetShowController',
    breadcrumbs: [{'href': '/path'}]}
   ).when('/:id/edit', {
    templateUrl: 'edit/edit.html',
    controller: 'DatasetEditController'
  }).when('/', {
    templateUrl: 'search/search.html',
    controller: 'DatasetSearchController'
  });
};

module.exports = router;
