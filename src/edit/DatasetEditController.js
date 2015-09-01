'use strict';

/**
 * @ngInject
 */
var DatasetEditController = function ($scope, $controller, $routeParams, Dataset) {

  // EditController -> NpolarEditController
  $controller('NpolarEditController', { $scope: $scope });
  
  // Dataset -> npolarApiResource -> ngResource
  $scope.resource = Dataset;

  // Formula ($scope.formula set by parent)
  $scope.formula.schema = '//api.npolar.no/schema/dataset';
  $scope.formula.form = 'edit/formula.json';

  // edit (or new) action
  $scope.edit();

};

module.exports = DatasetEditController;