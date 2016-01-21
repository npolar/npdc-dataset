'use strict';

/**
 * @ngInject
 */
var DatasetEditController = function ($scope, $controller, $routeParams, Dataset, NpdcSearchService) {

  // EditController -> NpolarEditController
  $controller('NpolarEditController', { $scope: $scope });

  // Dataset -> npolarApiResource -> ngResource
  $scope.resource = Dataset;

  // Formula ($scope.formula is set by parent)
  $scope.formula.schema = '//api.npolar.no/schema/dataset-1';
  $scope.formula.form = 'edit/formula.json';
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
    },
    {
      match(field) { return field.id === "people_object"; },
      template: '<npdc:formula-person></npdc:formula-person>'
    },
    {
      match(field) { return field.id === "placenames_object"; },
      template: '<npdc:formula-placename></npdc:formula-placename>'
    }/*,
    { match(field) { return field.path === "#/gcmd"; },
      template: '<npdc:formula-gcmd></npdc:formula-gcmd>'
    }*/
  ];
  
  // @todo
  // gcmd keywords
  // The 'tags' field would be nice to have facet autocomplete on, but does not currently work...
  // gcmd_short_name http://api.npolar.no/gcmd/concept/?q=&filter-concept=providers&fields=label&variant=array&format=json
  // links.type => iana
  NpdcSearchService.injectAutocompleteFacetSources(['organisations.gcmd_short_name', 'links.type'], Dataset);

  $scope.edit();
};

module.exports = DatasetEditController;

// FIXME @todo Add autocomplete for GCMD Science Keywords

//gcmd.sciencekeywords.Category => http://api.npolar.no/gcmd/concept/?q=&filter-concept=sciencekeywords&filter-cardinality=1
  // "label": "EARTH SCIENCE" => e9f67a66-e9fc-435c-b720-ae32a2c3d8f5

//gcmd.sciencekeywords.Topic =>  http://api.npolar.no/gcmd/concept/?q=&filter-concept=sciencekeywords&filter-cardinality=2
//
// &parent=

//gcmd.sciencekeywords.Term => http://api.npolar.no/gcmd/concept/?q=&filter-concept=sciencekeywords&filter-cardinality=3

// <Detailed_Variable>text</Detailed_Variable> => free text
