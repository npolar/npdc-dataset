'use strict';

function Dataset($location, $q, DatasetResource, DatasetModel, NpolarApiSecurity) {
  'ngInject';
  
  const schema = 'http://api.npolar.no/schema/dataset-1';
  
  const license = 'http://creativecommons.org/licenses/by/4.0/';

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
  
  DatasetResource.schema = schema;
  
  DatasetResource.license = license;
    
  DatasetResource.create = function() {

      let user = NpolarApiSecurity.getUser();
      let id = user.email;
      let email = user.email;
      let [first_name,last_name] = user.name.split(' ');
      let organisation = user.email.split('@')[1];
      
      user = { id, roles: ['editor', 'pointOfContact'], first_name, last_name, email, organisation};
      let collection = 'dataset';
      let topics = ['other'];
      let title = `Dataset created by ${user.email} ${new Date().toISOString()}`;
      let people = [user];
      let sets = []; 
      //let locations = [{ country: 'NO'}];

      if (DatasetModel.isNyÅlesund()) {
        sets.push('Ny-Ålesund');
      }

      return { title, collection, schema, people, topics, draft:'no', sets };
    };
    
    // The hashi (v0) file object should be object with keys filename, url, [file_size, icon, extras].
    DatasetResource.hashiObject = function(attachment) {
      //console.debug('hashiObject()', 'attachment:', attachment);
      return {
        url: attachment.href,
        filename: attachment.filename,
        content_type: attachment.type
      };
    };
  
    DatasetResource.attachmentObject = function(hashi) {
      //console.debug('attachmentObject()', 'hashi:', hashi);
      return {
        href: hashi.url,
        filename: hashi.filename,
        type: hashi.content_type,
      };
    };
    
    DatasetResource.linkObject = function(hashi, license) {
      return {
        rel: 'data',
        href: hashi.url,
        title: hashi.filename,
        type: hashi.content_type,
        hash: 'md5:'+hashi.md5sum,
        license
      };
    };

  return DatasetResource;
}
module.exports = Dataset;
