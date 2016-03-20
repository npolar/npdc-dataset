'use strict';

function Dataset($location, $q, DatasetResource) {
  'ngInject';
  DatasetResource.geoQuery = function(bounds) {
    let deferred = $q.defer();
    DatasetResource.feed(Object.assign({}, {
      'filter-coverage.north': bounds.getSouth() + '..',
      'filter-coverage.south': '..' + bounds.getNorth(),
      'filter-coverage.west': '..' + bounds.getEast(),
      'filter-coverage.east': bounds.getWest() + '..'
    }, $location.search()), response => {
      let points = [];
      response.feed.entries.forEach(e => {
        if (e.coverage) {
          e.coverage.forEach(cov => {
            points.push({
              popup: `<a href="${DatasetResource.href(e.id)}">${e.title}</a>`,
              point: [
                cov.south + Math.abs(cov.north - cov.south) / 2,
                cov.west + Math.abs(cov.east - cov.west) / 2
              ]
            });
          });
        }
      });
      deferred.resolve(points);
    }, error => {
      deferred.reject([]);
    });
    return deferred.promise;
  };

  return DatasetResource;
}
module.exports = Dataset;
