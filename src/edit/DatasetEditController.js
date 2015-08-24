'use strict';
/**
 * @ngInject
 */
var DatasetEditController = function ($scope, $controller, $routeParams, Dataset) {

  // EditController -> NpolarUiEditController
  $controller('NpolarEditController', { $scope: $scope });

  $scope.formula = {
    schema: '//api.npolar.no/schema/dataset',
    form: 'edit/formula.json'
  };

  // Dataset -> npolarApiResource -> ngResource
  $scope.resource = Dataset;

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
