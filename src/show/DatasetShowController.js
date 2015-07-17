'use strict';
/**
 * @ngInject
 */
var DatasetShowController = function ($scope, $controller, Dataset) {
  $controller('NpolarBaseController', {$scope: $scope});
  $scope.resource = Dataset;
  $scope.show();
};

module.exports = DatasetShowController;
