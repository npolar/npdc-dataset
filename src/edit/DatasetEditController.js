'use strict';

function DatasetEditController($scope, $controller, $routeParams,
  formula, formulaAutoCompleteService, npdcAppConfig, chronopicService, fileFunnelService,
  NpolarMessage, NpolarApiSecurity, NpolarLang,
  Dataset) {
  
  'ngInject';

  function init() {
    
    $controller('NpolarEditController', {
      $scope: $scope
    });
  
    $scope.resource = Dataset;
  
    let formulaOptions = {
      schema: 'edit/dataset-1.json', //'//api.npolar.no/schema/dataset-1',
      form: 'edit/formula.json',
      language: NpolarLang.getLang(),
      templates: npdcAppConfig.formula.templates.concat([{
        match(field) {
          if (field.id === 'links_item') {
            let match;
          
          // Hide data links and system links for the ordinary links block (defined in formula as instance === 'links')
            match = ["data", "alternate", "edit", "via"].includes(field.value.rel) && field.parents[field.parents.length-1].instance === 'links';
            console.log(match, field.id, field.path, 'value', field.value, 'instance', field.parents[field.parents.length-1].instance);
            return match;
          }
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
      }
    ]),
      languages: npdcAppConfig.formula.languages.concat([{
        map: require('./en.json'),
        code: 'en'
      }, {
        map: require('./no.json'),
        code: 'nb_NO',
      }])
    };
  
    $scope.formula = formula.getInstance(formulaOptions);
    
    //initFileUpload($scope.formula);
    
    formulaAutoCompleteService.autocompleteFacets(['organisations.name', 'organisations.email',
      'organisations.homepage', 'organisations.gcmd_short_name', 'links.type', 'tags', 'sets'], Dataset, $scope.formula);
      
    chronopicService.defineOptions({ match: 'released', format: '{date}'});
    chronopicService.defineOptions({ match(field) {
      return field.path.match(/^#\/activity\/\d+\/.+/);
    }, format: '{date}'});
    
    
  }
  
  function initFileUpload(formula) {

    let server = `${NpolarApiSecurity.canonicalUri($scope.resource.path)}/:id/_file`;
      fileFunnelService.fileUploader({
        match(field) {
          return field.id === "links" && field.instance === 'data';
        },
        server,
        multiple: true,
        restricted: false,
        fileToValueMapper: Dataset.linkObject,
        valueToFileMapper: Dataset.hashiObject,
        fields: ['license', 'href', 'type']
      }, formula);  
  }
  
  try {
    init();
     // edit (or new) action
     $scope.edit();
  } catch (e) {
    NpolarMessage.error(e);
  }
  
}

module.exports = DatasetEditController;
