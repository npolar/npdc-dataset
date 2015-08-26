'use strict';
require('should');
var DatasetEditController = require('./DatasetEditController');

describe('DatasetEditController', function () {
  var $scope, $controller, $routeParams, Dataset;

  // Set up mocks
  before(function () {
    $scope = {formula: {}, edit: function () {}};
    $routeParams = {};
    Dataset = {};
    $controller = function () {};
  });

  describe('#initFormula', function () {
    it('should set up formula on $scope', function () {
      // jshint unused:false
      var datasetEditController = new DatasetEditController($scope, $controller, $routeParams, Dataset);
      var expected = {
        schema: '//api.npolar.no/schema/dataset',
      };
      $scope.formula.schema.should.eql(expected.schema);
    });
  });
});
