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
  $scope.formula.schema = '//api.npolar.no/schema/dataset-1';
  $scope.formula.form = 'edit/formula.json';
  $scope.formula.template = 'material';
  $scope.formula.templates = [
    {
      match(field) {
        if (field.parents.length === 1 && field.parents[0].id === "links") {
          return field.fields.some(subField =>
            subField.id === "rel" && ["alternate", "edit", "via"].includes(subField.value)
          );
        }
      },
      hidden: true
    }
  ];
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


// FIXME
//
// Document not vaild ["#/organisations/organisations_object/email (silent)", "#/organisations/organisations_object/email (Valida…rmat validation failed (RCF 3696 e-mail address))"]0: "#/organisations/organisations_object/email (silent)"1: "#/organisations/organisations_object/email (ValidationError: Format validation failed (RCF 3696 e-mail address))"length: 2__proto__: Array[0]
