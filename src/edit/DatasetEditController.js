'use strict';

function DatasetEditController($scope, $controller, $routeParams, $http, $timeout,
  formula, formulaAutoCompleteService, npdcAppConfig, chronopicService, fileFunnelService,
  NpolarMessage, NpolarApiSecurity, NpolarLang, NpolarTranslate,
  Dataset, DatasetModel, DatasetFactoryService) {
  
  'ngInject';
  
  const schema = '//api.npolar.no/schema/dataset-1';
  //const schema = NpolarApiSecurity.canonicalUri(Dataset.schema());
  //const schema = "edit/dataset-1.json";
  $scope.resource = DatasetFactoryService.resourceFactory();
  
  function isHiddenLink(rel) {
    if (rel.rel) {
      rel = rel.rel;
    }
    return ["alternate", "edit", "via"].includes(rel);
  }
  
  function init() {
    
    $controller('NpolarEditController', {
      $scope: $scope
    });
  
    let formulaOptions = {
      schema,
      form: 'edit/formula.json',
      language: NpolarLang.getLang(),
      templates: npdcAppConfig.formula.templates.concat([{
        match(field) {
          if (field.id === 'links_item') {
              
            // Hide data links and system links
            return isHiddenLink(field.value.rel); 
          }
        },
        hidden: true
        
      },{
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
    ])
      // Disabled until https://github.com/npolar/formula/issues/30 is fixed
      //,
      //languages: npdcAppConfig.formula.languages.concat([{
      //  map: require('./en.json'),
      //  code: 'en'
      //}, {
      //  map: require('./no.json'),
      //  code: 'nb_NO',
      //}])
    };
  
    $scope.formula = formula.getInstance(formulaOptions);
    
    if (!DatasetModel.isNyÅlesund()) {
      initFileUpload($scope.formula);
    }
    
    formulaAutoCompleteService.autocompleteFacets(['organisations.name', 'organisations.email',
      'organisations.homepage', 'organisations.gcmd_short_name', 'links.type', 'tags', 'sets', 'licenses_item'], $scope.resource, $scope.formula);
      
    // Disabled bacause of UI/usability problems 
    /*chronopicService.defineOptions({ match: 'released', format: '{date}'});
    chronopicService.defineOptions({ match(field) {
      return field.path.match(/^#\/activity\/\d+\/.+/);
    }, format: '{date}'}); */
  }
   
  function initFileUpload(formula) {

    let server = `${NpolarApiSecurity.canonicalUri($scope.resource.path)}/:id/_file`;
    fileFunnelService.fileUploader({
      match(field) {
        return field.id === "attachments";
      },
      server,
      multiple: true,
      restricted: false,
      fileToValueMapper: $scope.resource.attachmentObject,
      valueToFileMapper: $scope.resource.hashiObject,
      fields: ['href', 'filename', 'type']
    }, formula);  
  }
 
  try {
    init();
     // edit (or new) action
    $scope.edit().$promise.then(dataset => {
      NpolarTranslate.dictionary['npdc.app.Title'] = DatasetModel.getAppTitle();  

      // Grab attachments and force update attachments and links
      let fileUri = `${NpolarApiSecurity.canonicalUri($scope.resource.path)}/${dataset.id}/_file`;
      
      $http.get(fileUri).then(r => {
        if (r && r.data && r.data.files && r.data.files.length > 0) {
          let dataset = $scope.formula.getModel();
          let files = r.data.files;
          
          let attachments = files.map(hashi => Dataset.attachmentObject(hashi));
          dataset.attachments = attachments;
          
          r.data.files.forEach(f => {
            let link = dataset.links.find(l => l.href === f.url);
            
            if (!link) {
              let license = dataset.licences[0] || Dataset.license;
              link = Dataset.linkObject(f, license);
              dataset.links.push(link);
            }
            // else findIndex & objhect.assign?
          });
          $scope.formula.setModel(dataset);
        }
      });
      
      
      
    });
    
  } catch (e) {
    NpolarMessage.error(e);
  }
  
}

module.exports = DatasetEditController;
