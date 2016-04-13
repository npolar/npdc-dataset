'use strict';
var npdcCommon = require('npdc-common');
var AutoConfig = npdcCommon.AutoConfig;

var angular = require('angular');
require('npdc-common/src/wrappers/leaflet');

var npdcDatasetApp = angular.module('npdcDatasetApp', ['npdcCommon', 'leaflet']);

npdcDatasetApp.factory('Dataset', require('./Dataset'));
npdcDatasetApp.controller('DatasetShowController', require('./show/DatasetShowController'));
npdcDatasetApp.controller('DatasetSearchController', require('./search/DatasetSearchController'));
npdcDatasetApp.controller('DatasetEditController', require('./edit/DatasetEditController'));
//npdcDatasetApp.controller('DatasetFormulaController', require('./edit/FormulaController'));
npdcDatasetApp.directive('datasetCoverage', require('./edit/coverage/coverageDirective'));

// Bootstrap ngResource models using NpolarApiResource
var resources = [
  {'path': '/', 'resource': 'NpolarApi'},
  {'path': '/user', 'resource': 'User'},
  {'path': '/dataset', 'resource': 'DatasetResource' },
  {'path': '/publication', 'resource': 'Publication' },
  {'path': '/project', 'resource': 'Project' }

];

resources.forEach(service => {
  // Expressive DI syntax is needed here
  npdcDatasetApp.factory(service.resource, ['NpolarApiResource', function (NpolarApiResource) {
  return NpolarApiResource.resource(service);
  }]);
});

npdcDatasetApp.factory('L', function() {
  return window.L; // assumes Leaflet has already been loaded on the page
});


// Routing
npdcDatasetApp.config(require('./router'));

npdcDatasetApp.config(($httpProvider, npolarApiConfig) => {
  var autoconfig = new AutoConfig("production");
  angular.extend(npolarApiConfig, autoconfig, { resources });
  console.debug("npolarApiConfig", npolarApiConfig);

  $httpProvider.interceptors.push('npolarApiInterceptor');
});

npdcDatasetApp.run(($http, npdcAppConfig, NpolarTranslate, NpolarLang) => {
  NpolarTranslate.loadBundles('npdc-dataset');
  npdcAppConfig.toolbarTitle = 'Datasets';
});
