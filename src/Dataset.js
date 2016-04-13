'use strict';

function Dataset($location, $q, DatasetResource, NpolarApiSecurity) {
  'ngInject';
  
  const schema = 'http://api.npolar.no/schema/publication-1';

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
    
  DatasetResource.create = function() {

      let user = NpolarApiSecurity.getUser();
      let id = user.email;
      let email = user.email;
      let [first_name,last_name] = user.name.split(' ');
      let organisation = user.email.split('@')[1];
      
      user = { id, roles: ['author'], first_name, last_name, email, organisation};
      let collection = 'publication';
      let publication_type = 'other';
      let topics = ['other'];
      let title = `Publication created by ${user.email} ${new Date().toISOString()}`;
      let people = [user];
      let locations = [{ country: 'NO'}];
      
    
      //let id = PublicationResource.randomUUID();
      let p = { title, collection, schema, people, publication_type, topics, locations,
        state:'published', draft:'no'
      };
      console.debug(p);
      return p;
      
    };
    
    // The hashi (v0) file object should be object with keys filename, url, [file_size, icon, extras].
    DatasetResource.hashiObject = function(link) {
      console.debug('hashiObject', link);
      // Ignore links that are not data 
      if (link.rel !== 'data') {
        return null;
      }
      return {
        url: link.href,
        filename: link.title,
        file_size: link.length,
        md5sum: (link.hash||'md5:').split('md5:')[1],
        content_type: link.type
      };
    };
  
    DatasetResource.linkObject = function(hashi) {
      console.debug('linkObject', hashi);
      return {
        rel: 'data',
        href: hashi.url,
        title: hashi.filename,
        length: hashi.file_size,
        hash: 'md5:'+hashi.md5sum,
        type: hashi.content_type
      };
    };

  return DatasetResource;
}
module.exports = Dataset;
