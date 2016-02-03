'use strict';

var DatasetEditController = function ($scope, $controller, $routeParams, Dataset, formula, npdcAppConfig, formulaAutoCompleteService) {
  'ngInject';

  // EditController -> NpolarEditController
  $controller('NpolarEditController', { $scope: $scope });

  // Dataset -> npolarApiResource -> ngResource
  $scope.resource = Dataset;

  let formulaOptions = {
    schema: '//api.npolar.no/schema/dataset-1',
    form: 'edit/formula.json',
    templates: npdcAppConfig.formula.templates.concat([
      {
        match(field) {
          return ["alternate", "edit", "via"].includes(field.value.rel);
        },
        hidden: true
      },
      {
        match(field) {
          return field.id === "people_object";
        },
        template: '<npdc:formula-person></npdc:formula-person>'
      },
      {
        match: "gcmd",
        template: '<npdc:formula-gcmd></npdc:formula-gcmd>'
      },
      {
        match: "sciencekeywords_object",
        template: '<npdc:formula-gcmd-keyword></npdc:formula-gcmd-keyword>'
      },
    ])
  };

  $scope.formula = formula.getInstance(formulaOptions);
  formulaAutoCompleteService.optionsFromFacets(['organisations.gcmd_short_name'], Dataset, $scope.formula);


  $scope.edit();
};

module.exports = DatasetEditController;
