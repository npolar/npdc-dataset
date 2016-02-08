'use strict';

var DatasetEditController = function($scope, $controller, $routeParams, Dataset, formula,
  formulaAutoCompleteService, npdcAppConfig) {
  'ngInject';

  // EditController -> NpolarEditController
  $controller('NpolarEditController', {
    $scope: $scope
  });

  // Dataset -> npolarApiResource -> ngResource
  $scope.resource = Dataset;

  let formulaOptions = {
    schema: '//api.npolar.no/schema/dataset-1',
    form: 'edit/formula.json',
    templates: npdcAppConfig.formula.templates.concat([{
      match(field) {
        return ["alternate", "edit", "via"].includes(field.value.rel);
      },
      hidden: true
    }, {
      match: "people_item",
      template: '<npdc:formula-person></npdc:formula-person>'
    }, {
      match: "gcmd",
      template: '<npdc:formula-gcmd></npdc:formula-gcmd>'
    }, {
      match: "sciencekeywords_item",
      template: '<npdc:formula-gcmd-keyword></npdc:formula-gcmd-keyword>'
    }, {
      match: "coverage_item",
      template: "<dataset:coverage></dataset:coverage>"
    }, {
      match: "placenames_item",
      template: '<npdc:formula-placename></npdc:formula-placename>'
    }]),
    languages: npdcAppConfig.formula.languages
  };

  $scope.formula = formula.getInstance(formulaOptions);
  formulaAutoCompleteService.optionsFromFacets(['organisations.name', 'organisations.email',
    'organisations.homepage', 'organisations.gcmd_short_name', 'links.type'], Dataset, $scope.formula);


  $scope.edit();
};

module.exports = DatasetEditController;
