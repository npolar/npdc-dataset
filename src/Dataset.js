'use strict';

function Dataset($location, $http, $q, DatasetResource, DatasetModel, NpolarApiSecurity) {
  'ngInject';
  
  const schema = 'http://api.npolar.no/schema/dataset-1';
  
  const license = 'http://creativecommons.org/licenses/by/4.0/';
  
  
  DatasetResource.unprotectFiles = (files) => {
    console.log('Removing protection for', files.map(f => f.filename||f.href));
    files.forEach(f => {
      $http.post(`${f.href}?restricted=false`).then(r => {
        
      });
    });  
  };
  
  DatasetResource.protectFiles = (files) => {
    console.log('Protecting', files.map(f => f.filename||f.href));
    files.forEach(f => {
      $http.put(`${f.href}?restricted=true`).then(r => {
      });
    });  
  };

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
      let homepage = `http://www.npolar.no/en/people/${email.split('@')[0]}`;
      let [first_name,last_name] = user.name.split(' ');
      let organisation = user.email.split('@')[1];
      
      user = { id, roles: ['editor', 'pointOfContact'], first_name, last_name, email, homepage, organisation };
      let collection = 'dataset';
      let topics = [];
      let released = new Date().toISOString();
      let licences = [license];
      let title = `Dataset created by ${user.email} ${released}`;
      let people = [user];
      let sets = []; 
      //let locations = [{ country: 'NO'}];

      if (DatasetModel.isNyÅlesund()) {
        sets.push('Ny-Ålesund');
      }

      return { title, released, licences, collection, schema, people, topics, draft:'no', sets };
    };
    
    // The hashi (v0) file object should be object with keys filename, url, [file_size, icon, extras].
    DatasetResource.hashiObject = function(attachment) {
      console.debug('hashiObject()', 'attachment:', attachment);
      return {
        url: attachment.href,
        filename: attachment.filename,
        content_type: attachment.type
      };
    };
  
    DatasetResource.attachmentObject = function(hashi) {

      let href = hashi.url;
      if ((/\/[0-9a-f]{32,}$/i).test(hashi.url)) {
        href = hashi.url.split('/');
        href.pop();
        href = encodeURI(`${ href.join('/') }/${ encodeURIComponent(hashi.filename) }`);
      }
      
      let a = {
        href,
        filename: hashi.filename,
        type: hashi.content_type,
      };
      console.debug('attachmentObject()', 'hashi:', hashi, '=>', a);
      return a;
    };

  return DatasetResource;
}
module.exports = Dataset;
