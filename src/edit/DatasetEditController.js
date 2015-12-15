'use strict';

/**
 * @ngInject
 */
var DatasetEditController = function ($scope, $controller, $routeParams, Dataset) {

  // EditController -> NpolarEditController
  $controller('NpolarEditController', { $scope: $scope });

  // Dataset -> npolarApiResource -> ngResource
  $scope.resource = Dataset;

  // Formula ($scope.formula is set by parent)
  $scope.formula.schema = '//api.npolar.no/schema/dataset';
  $scope.formula.form = 'edit/formula.json';
  $scope.formula.template = 'material';
  //$scope.formula.saveHidden = false;
  // edit (or new) action
  $scope.edit();

};

module.exports = DatasetEditController;

// FIXME @todo Autocomplete for GCMS Science Keywords

//gcmd.sciencekeywords.Category => http://api.npolar.no/gcmd/concept/?q=&filter-concept=sciencekeywords&filter-cardinality=1
  // "label": "EARTH SCIENCE" => e9f67a66-e9fc-435c-b720-ae32a2c3d8f5

//gcmd.sciencekeywords.Topic =>  http://api.npolar.no/gcmd/concept/?q=&filter-concept=sciencekeywords&filter-cardinality=2
//
// &parent=

//gcmd.sciencekeywords.Term => http://api.npolar.no/gcmd/concept/?q=&filter-concept=sciencekeywords&filter-cardinality=3

// <Detailed_Variable>text</Detailed_Variable> => free text
