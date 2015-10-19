'use strict';

var environment = require('../environment');
var npdcCommon = require('npdc-common');
var AutoConfig = npdcCommon.AutoConfig;

var angular = require('angular');
require('formula');
require('angular-route');
require('angular-npolar');

var npdcDatasetApp = angular.module('npdcDatasetApp', ['ngRoute', 'formula', 'npolarApi', 'npolarUi', 'npdcUi', 'templates']);

npdcDatasetApp.controller('DatasetShowController', require('./show/DatasetShowController'));
npdcDatasetApp.controller('DatasetSearchController', require('./search/DatasetSearchController'));
npdcDatasetApp.controller('DatasetEditController', require('./edit/DatasetEditController'));
npdcDatasetApp.directive('citation', require('./show/citationDirective'));
npdcDatasetApp.directive('organisation', require('./show/organisationDirective'));
npdcDatasetApp.directive('person', require('./show/personDirective'));
npdcDatasetApp.directive('link', require('./show/linkDirective'));


// Bootstrap ngResource models using NpolarApiResource
var resources = [
  {'path': '/', 'resource': 'NpolarApi'},
  {'path': '/user', 'resource': 'User'},
  {'path': '/dataset', 'resource': 'Dataset' },
  {'path': '/publication', 'resource': 'Publication' },
  {'path': '/project', 'resource': 'Project' }

];

resources.forEach(service => {
  // Expressive DI syntax is needed here
  npdcDatasetApp.factory(service.resource, ['NpolarApiResource', function (NpolarApiResource) {
  return NpolarApiResource.resource(service);
  }]);
});

// Routing
npdcDatasetApp.config(require('./router')).config(function($mdThemingProvider) {
  $mdThemingProvider.theme('altTheme');
});


// API HTTP interceptor
npdcDatasetApp.config($httpProvider => {
  $httpProvider.interceptors.push('npolarApiInterceptor');
});

// Inject npolarApiConfig and run
npdcDatasetApp.run((npolarApiConfig, npdcAppConfig) => {
  var autoconfig = new AutoConfig(environment);
  angular.extend(npolarApiConfig, autoconfig, { resources });
  npdcAppConfig.cardTitle = '';
  npdcAppConfig.toolbarTitle = 'Datasets';
  console.debug("npolarApiConfig", npolarApiConfig);
});
