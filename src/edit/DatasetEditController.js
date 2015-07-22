'use strict';
/**
 * @ngInject
 */
var DatasetEditController = function ($scope, $controller, $routeParams, Dataset) {

  // EditController -> NpolarUiEditController
  $controller('NpolarEditController', { $scope: $scope });

  $scope.initFormula = function() {
    // Inject schema and form(ula)
    $scope.formula.schema = '//api.npolar.no/schema/dataset';
    $scope.formula.form = 'edit/formula.json';
    //$scope.formula.template = 'formula';
  };

  // Dataset -> npolarApiResource -> ngResource
  $scope.resource = Dataset;
  $scope.initFormula();

  $scope.expert = function() {
    $scope.formula.form = null;
  };

  $scope.isExpert = function() {
    return ($scope.formula.form === null);
  };

  // edit (or new) action
  $scope.edit();

};

module.exports = DatasetEditController;
