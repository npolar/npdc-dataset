'use strict';

function DatasetEditController($scope, $controller, $routeParams, $http, $timeout, $route, $location,
  formula, formulaAutoCompleteService, npdcAppConfig, chronopicService, fileFunnelService,
  NpolarMessage, NpolarApiSecurity, NpolarLang, NpolarTranslate,
  //NpdcWarningsService,
  Dataset, DatasetModel, DatasetFactoryService) {
  
  'ngInject';
  
  let self = this;
  
  const schema = DatasetModel.schema;
  $scope.resource = DatasetFactoryService.resourceFactory();
  $scope.model = DatasetModel;
  
  this.file_server = (id=':id', base=NpolarApiSecurity.canonicalUri($scope.resource.path)) => `${base}/${id}/_file`;
  
  this.data_link = (dataset, filename='_all', title=dataset.doi||`npolar.no-dataset-${dataset.id}`, rel='data', format='zip', file_server=self.file_server(dataset.id)) => {
    return { rel, href: `${file_server}/${filename}?filename=${title}&format=${format}`, title, type: `application/${format}` };
  }
  
  $scope.$on('npdc-filefunnel-upload-completed', (event, files) => {
    if (!$scope.formula) { return; }
    
    let d = $scope.formula.getModel();
    
    let hasDataLink = ((d.links||[]).findIndex(l => l.rel === 'data') > 0);

    if (!hasDataLink) {
      d.links.push(self.data_link(d));
      if (!d.attachments) {
        d.attachments = [];
      }
      // This duplicates attachments injection 
      let attachments = files.map(f => f.reference).map(r => {
        return { href: `${self.file_server(d.id)}/${encodeURIComponent(r.name)}`, type: r.type, filename: r.name };
      });
      
      d.attachments = d.attachments.concat(attachments);
      console.log(d.attachments);
      $scope.formula.setModel(d);
      $scope.formula.save();
    } else {
      $scope.formula.save();
    }
    $location.path(d.id);
    $route.reload();
    
  });

  
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
      },{
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
   
  function initFileUpload(formula, server=self.file_server()) {

    fileFunnelService.fileUploader({
      match(field) {
        return field.id === "attachments";
      },
      server,
      multiple: true,
      restricted: false,
      fileToValueMapper: $scope.resource.attachmentObject,
      valueToFileMapper: $scope.resource.hashiObject,
      fields: ['href']
    }, formula);  
  }
    
  try {
    init();
     // edit (or new) action
    $scope.edit().$promise.then(dataset => { 
      NpolarTranslate.dictionary['npdc.app.Title'] = DatasetModel.getAppTitle();
    });
    
  } catch (e) {
    NpolarMessage.error(e);
  }
  
}

module.exports = DatasetEditController;
