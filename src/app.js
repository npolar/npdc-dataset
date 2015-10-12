'use strict';

var environment = require('../environment');
var npdcCommon = require('npdc-common');
var AutoConfig = npdcCommon.AutoConfig;

var angular = require('angular');
require('formula');
require('angular-route');
require('angular-npolar');

var npdcDatasetApp = angular.module('npdcDatasetApp', ['ngRoute', 'formula', 'npolarApi', 'npolarUi', 'npdcUi', 'templates']);

npdcDatasetApp.controller('LayoutCtrl', require('./LayoutCtrl'));
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

// npolar.no (209) sysselmannen.no (7) nsidc.org (5) uit.no (5) unis.no (4) akvaplan.niva.no (2) awi.de (2) geo.mn.uio.no (2) kartverket.no (2) nina.no (2) niva.no (2) nmbu.no (2) pangaea.de (2) bgs.ac.uk (1) bio.uio.no (1) ceh.ac.uk (1) dirmin.no (1) geo.su.se (1) geo.uu.se (1) igf.edu.pl (1) isac.cnr.it (1) ksat.no (1) loff.biz (1) marecol.gu.se (1) miljodirektoratet.no (1) museumstavanger.no (1) nilu.no (1) ntnu.no (1) nve.no (1) oru.se (1) sams.ac.uk (1) shef.ac.uk (1) smru.st-andrews.ac.uk (1) spacecentre.no (1) uef.fi (1) uibk.ac.at (1) ustc.edu.cn (1)
//npdcDatasetApp.filter('name', function() {
//  return function(input, organisations) {
//  console.log("npdcDatasetFilters", input, organisations);
//  return input;
//  };
//});

npdcDatasetApp.filter('isodate', function() {
  return function(input) {
  if ((/^\d{4}\-\d{2}\d{2}T/).test(input)) {
    return input.split("T")[0];
  } else {
    return input;
  }

  };
});

npdcDatasetApp.filter('year', function() {
  return function(input) {
  if ((/^\d{4}(\-\d{2}\d{2}T)?/).test(input)) {
    return input.split("-")[0];
  } else {
    return input;
  }

  };
});

//npdcDatasetApp.filter('i', function() {
//  return function(input) {
//  if ((/_/).test(input)) {
//    return input.split("T")[0];
//  } else {
//    return input;
//  }
//
//  };
//});

npdcDatasetApp.filter('lang', ($log) => {
  return function(texts, prop) {
  if (texts === undefined) {
    return '';
  }
  let text = texts.find(t => { return (t.lang === 'en'); });
  if (text[prop]) {
    return text[prop];
  } else {
    return texts[0][prop];
  }
  };
});


// API HTTP interceptor
npdcDatasetApp.config($httpProvider => {
  $httpProvider.interceptors.push('npolarApiInterceptor');
});

// Inject npolarApiConfig and run
npdcDatasetApp.run(npolarApiConfig => {
  var autoconfig = new AutoConfig(environment);
  angular.extend(npolarApiConfig, autoconfig, { resources });
  console.debug("npolarApiConfig", npolarApiConfig);
});
