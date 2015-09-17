'use strict';

// @ngInject
let LayoutCtrl = function ($scope) {
  let appName = 'Dataset';

  $scope.sidenav = {
    title: appName,
    menu: [{
      title: 'New',
      link: '__new/edit',
    }]
  };

  $scope.toolbar = {
    title: appName,
    sidenav: true
  };

};

module.exports = LayoutCtrl;
