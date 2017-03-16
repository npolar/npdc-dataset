'use strict';
let npdcCommon = require('npdc-common');
let AutoConfig = npdcCommon.AutoConfig;

let angular = require('angular');
require('npdc-common/src/wrappers/leaflet');

let npdcDatasetApp = angular.module('npdcDatasetApp', ['npdcCommon', 'leaflet']);

npdcDatasetApp.service('DatasetModel', require('./DatasetModel'));
npdcDatasetApp.service('DatasetCitation', require('./DatasetCitation'));

npdcDatasetApp.factory('Dataset', require('./Dataset'));
npdcDatasetApp.controller('DatasetShowController', require('./show/DatasetShowController'));
npdcDatasetApp.controller('DatasetSearchController', require('./search/DatasetSearchController'));
npdcDatasetApp.controller('DatasetEditController', require('./edit/DatasetEditController'));
npdcDatasetApp.directive('datasetCoverage', require('./edit/coverage/coverageDirective'));

npdcDatasetApp.service('DatasetFactoryService', ($location, DatasetModel, Dataset, NyAlesundDataset) => {
  'ngInject';

  return {
    resourceFactory: function() {
      if (DatasetModel.isNyÅlesund()) {
        return NyAlesundDataset;
      } else {
        return Dataset;
      }
    }
  };

});

// Bootstrap ngResource models using NpolarApiResource
let resources = [
  {'path': '/', 'resource': 'NpolarApi'},
  {'path': '/user', 'resource': 'User'},
  {'path': '/dataset', 'resource': 'DatasetResource' },
  {'path': '/dataset/ny-alesund', 'resource': 'NyAlesundDataset', 'uiBase': '/dataset/ny-ålesund' },
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

npdcDatasetApp.config(require('./router'));
npdcDatasetApp.config(($httpProvider, npolarApiConfig) => {

  let autoconfig = new AutoConfig('production');
  Object.assign(npolarApiConfig, autoconfig, { resources });
  console.debug('npolarApiConfig', npolarApiConfig);
  $httpProvider.interceptors.push('npolarApiInterceptor');

});

npdcDatasetApp.run((NpolarTranslate, npdcAppConfig) => {
  NpolarTranslate.loadBundles('npdc-dataset');
  //npdcAppConfig.help = {
  //  uri: "https://github.com/npolar/npdc-dataset/tree/master/docs"
  //};

});
