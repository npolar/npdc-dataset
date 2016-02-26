'use strict';

var DatasetEditController = function($scope, $controller, $routeParams, Dataset, formula,
  formulaAutoCompleteService, npdcAppConfig, chronopicService, fileFunnelService, NpolarLang) {
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
    language: NpolarLang.getLang(),
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
    }
  ]),
    languages: npdcAppConfig.formula.languages.concat([{
      map: require('./en.json'),
      code: 'en'
    },
    {
      map: require('./no.json'),
      code: 'nb_NO',
    }])
  };

  $scope.formula = formula.getInstance(formulaOptions);
  formulaAutoCompleteService.autocompleteFacets(['organisations.name', 'organisations.email',
    'organisations.homepage', 'organisations.gcmd_short_name', 'links.type', 'sets', 'tags'], Dataset, $scope.formula);

  chronopicService.defineOptions({ match: 'released', format: '{date}'});
  chronopicService.defineOptions({ match(field) {
    return field.path.match(/^#\/activity\/\d+\/.+/);
  }, format: '{date}'});


  let dataLinkSuccess = function (file) {
    return {
      rel: 'data',
      href: file.url,
      title: file.filename,
      length: file.file_size,
      hash: [file.md5sum],
      type: file.content_type
    };
  };

  fileFunnelService.fileUploader({
    match(field) {
       return field.id === "links" && field.instance === "data";
    },
    server: 'https://apptest.data.npolar.no:3000/dataset/:id/_file/',
    successCallback: dataLinkSuccess,
    filterValues: function (value) {
      return value.rel === 'data';
    },
    restricted: false
  }, $scope.formula);

  $scope.edit(/* generateUUID */ true);
};

module.exports = DatasetEditController;
