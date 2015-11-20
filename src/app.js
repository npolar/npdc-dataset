'use strict';

var environment = require('../environment');
var npdcCommon = require('npdc-common');
var AutoConfig = npdcCommon.AutoConfig;

var angular = require('angular');

var npdcDatasetApp = angular.module('npdcDatasetApp', ['npdcUi']);

npdcDatasetApp.controller('DatasetShowController', require('./show/DatasetShowController'));
npdcDatasetApp.controller('DatasetSearchController', require('./search/DatasetSearchController'));
npdcDatasetApp.controller('DatasetEditController', require('./edit/DatasetEditController'));
npdcDatasetApp.directive('leaflet', require('npdc-common/wrappers/leaflet'));

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
npdcDatasetApp.config(require('./router'));

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
