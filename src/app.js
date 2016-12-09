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
//npdcDatasetApp.controller('DatasetAutocompleteController', require('./search/DatasetAutocompleteController'));



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


// Routing
npdcDatasetApp.config(require('./router'));

npdcDatasetApp.config(($httpProvider, npolarApiConfig) => {
  
  let autoconfig = new AutoConfig('test');
  angular.extend(npolarApiConfig, autoconfig, { resources });
  
  console.debug('npolarApiConfig', npolarApiConfig);
  //console.debug("npolarDatasets", npolarDatasets.updated);
  //console.debug("npolarPeople", npolarPeople);
  

  $httpProvider.interceptors.push('npolarApiInterceptor');
});

npdcDatasetApp.run(($http, npdcAppConfig, NpolarTranslate, NpolarLang) => {
  NpolarTranslate.loadBundles('npdc-dataset');  
});
