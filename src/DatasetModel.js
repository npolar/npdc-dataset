'use strict';

function DatasetModel($location, $q, $http, NpolarTranslate, npolarPeople,
  DatasetCitation, Publication, Project) {
  'ngInject';
  
  let self = this;
  
  this.schema = '//api.npolar.no/schema/dataset-1';
  
  function name(email) {
  
    let p = npolarPeople.find(p => (p.email === email || (p.alias||[]).includes(email)));
    if (p) {
      if (p.name) {
       return p.name;
      } else {
        return `${p.first_name} ${p.last_name}`;
      }
      
    }
  }
  
  this.isNyÅlesund = () => {
    return (/\/ny\-[åa]lesund\//).test($location.path());
  };
  
  this.isDoi = (str) => {
    return (/^10[.][0-9]+[/].+/).test(str);
  };

  this.getAppTitle = () => {
    if (self.isNyÅlesund()) {
      return [
        {'@language': 'en', '@value': 'Ny-Ålesund datasets'},
        {'@language': 'no', '@value': 'Ny-Ålesund datasett'}
      ];
    } else {
      return [
        {'@language': 'en', '@value': 'Dataset catalogue'},
        {'@language': 'no', '@value': 'Datasett'}
      ];
    }
    
  };
  
  this.suggestions = (dataset, resource) => {
    
    let prune = (title) => {
      return title.replace(/\/\"\'\(\)/g, '').split(/\s[0-9]{4}/).join('');
    };
    let limit = 50;    
    let relatedDatasets = resource.array({
        q: prune(dataset.title),
        fields: 'id,title,collection',
        score: true,
        limit,
        'not-id': dataset.id,
        op: 'OR'
      }).$promise;
      let relatedPublications = Publication.array({
        q: prune(dataset.title),
        fields: 'id,title,published,collection,publication_type',
        //'not-publication_type': 'poster|abstract',
        score: true,
        limit,
        op: 'OR'
      }).$promise;
      let relatedProjects = Project.array({
        q: prune(dataset.title),
        fields: 'id,title,collection',
        score: true,
        limit,
        op: 'OR'
      }).$promise;
      return $q.all([relatedDatasets, relatedPublications, relatedProjects]);
  };
  
  this.metadata = (dataset, resource) => {
    let uri = self.uri(dataset); // URI to doi.org | data.npolar.no
    let id = dataset.links.find(l => l.rel === "edit").href;
    let edits = self.edits(dataset, resource);
    let byline = "See [the dataset catalogue](https://data.npolar.no/dataset/ae1a945b-6b91-42c0-86e6-4657b4b6ec3c) for details on accessing, reusing, and harvesting the entire metadata catalogue.";
    let document = { id, revision: dataset._rev.split('-')[0], created: dataset.created, updated: dataset.updated, created_by: name(dataset.created_by), updated_by: name(dataset.updated_by) };
    let schema = self.schema;
    return { uri, id, document, formats: self.alternateLinks(dataset), edits, editors: [], byline, schema };
  };
  
  this.edits = (dataset, resource) => {
    
    let edits = [];


    let created = { action: 'create', user: { id: dataset.created_by, name: name(dataset.created_by) }, when: dataset.created, comment: null, revision: null };
    let updated = { action: 'update', user: { id: dataset.updated_by, name: name(dataset.updated_by) }, when: dataset.updated, comment: null, revision: dataset._rev.split('-')[0] };
    
    let changes = (dataset.changes||[]).map(c => {
      let id;
      let name;
      if ((/[@]/).test(c.email)) {
        id = c.email;
      }
      if (!c.name || c.name === '') {
        c.name = c.email;
      }
      name = c.name;
      return { action: 'update', when: c.datetime, user: { id, name }, comment: c.comment };
    });
    
    edits[0] = created;
    edits = edits.concat(changes);
    edits = edits.concat(updated);
    
    let path = resource.path.replace('//api.npolar.no', '');
    
    $http.get('//api.npolar.no/editlog',
      { params: {
          q: '',
          limit: 'all',
          format: 'json',
          variant: 'array',
          sort: '-request.time',
          'filter-path': `${path}/${dataset.id}`,
          'filter-method': 'PUT',
          'filter-response.status': '200..299',
          //'filter-request.time': `${dataset.created}..${dataset.updated}`, only sensible if newest...
          fields: 'request.time,request.username,response.header.Location'
        },
        cache: true,
      }).then(r => {
        r.data.forEach(e => {
          // hmm only pushing one at a time works, probably async/digest issue
          // @todo refactor
          let href = e.response.header.Location;
          let revision = href.split('rev=')[1].split('-')[0]; 
          edits.push({ action: 'update', user: { id: e.request.username, name: name(e.request.username)}, when: e.request.time, href, revision });
        });
    });
    return edits;
  };
  
  this.alternateLinks = (dataset) => {
    let formats = dataset.links.filter(l => (l.rel === "alternate" || l.rel === "edit") && l.type !== 'text/html').map(l => {
      if (l.rel === 'edit') {
        l.title = "JSON";
      }
      return l;
    });
    
    if (!self.isNyÅlesund(dataset)) {
      formats.push({
        href: `//api.npolar.no/dataset/?q=&filter-id=${dataset.id}&format=json&variant=ld`,
        title: 'DCAT (JSON-LD)',
        type: 'application/ld+json'
      });
      
    }
    
    if (self.isDoi(dataset.doi)) {
      formats.push({
        href: `//data.datacite.org/application/vnd.datacite.datacite+xml/${dataset.doi}`,
        title: 'Datacite XML',
        type: 'vnd.datacite.datacite+xml'
      });
    }
    return formats;
  };
  
  this.authors = (dataset) => {

    let authors = [];
    
    if (dataset && dataset.people && dataset.people.length > 0) {
      authors = dataset.people.filter(p => (p.roles||[]).includes("author"));
    }
    if (!authors || authors.length === 0) {
      if (dataset && dataset.organisations && dataset.organisations.length > 0) {
        authors = dataset.organisations.filter(o => (o.roles||[]).includes("author"));
      }
    }
    return authors;
  };
  
  this.relations = (links=[], rels=['parent','publication','project']) => {
    if (!links) { return; }
    if (links.links) {
      links = links.links;
    }
    return links.filter(l => rels.includes(l.rel));
  };
  
  this.rel = (dataset, rel) => {
    if (!dataset) { return; }
    let r = self.relations(dataset, [rel]);
    if (r[0]) {
      rel = r[0];
      rel['@id'] = rel.href;
      return rel;
    } 
  };
  
  
  this.publisher = (dataset) => {
    let p = (dataset.organisations||[]).find(o => o.roles.includes("publisher"));
    if (p) {
      return p;
    } else {
      return { };
    }
  };
  
  this.published_year = (dataset) => {
    let y;
    if (dataset && dataset.released && (/^\d{4}/).test(dataset.released)) {
      y = new Date(dataset.released).getFullYear();
    } else {
      y = "not released";
    }
    return y;
  };
  
 
  // URI (web address) of the dataset  
  this.uri = (dataset) => {
    
    if (!dataset) { return; }
    
    // Use DOI if set
    if (dataset.doi && self.isDoi(dataset.doi)) {
      let f = dataset.doi.split(/^10./);
      return `https://doi.org/10.${f[1]}`;
    } else {
      let n = '';
      if (self.isNyÅlesund(dataset)) {
        n = 'ny-ålesund/';
      }
      return `https://data.npolar.no/dataset/${n}${ dataset.id }`;
    }
  };

  // Citation helper
  this.citation = (dataset, style) => {
    if (!dataset) {
      return;
    }
    
    let authors = self.authors(dataset);
    let author = authors;
    let year = self.published_year(dataset);
    let title = dataset.title;
    let type;
    let pub = self.publisher(dataset);
    let publisher = pub.name || pub.id;
    let uri = self.uri(dataset);
    let url = uri;
    let doi = dataset.doi;
    
    if ((/apa/i).test(style)) {
      type = 'Data set';
      return DatasetCitation.apa({ authors, year, title, type, publisher, uri });
    } else if ((/bibtex/i).test(style)){
      type = '@misc';
      return DatasetCitation.bibtex({ title, url, doi, type, publisher, author, year, id: dataset.id });      
    } else if ((/csl/i).test(style)){
      type = 'dataset';
      let issued = { 'date-parts': [year] };
      return DatasetCitation.csl({ type, DOI: doi, URL: url, title, publisher, issued, author });     
    } else {
      throw `Uknown citation style: ${style}`;
    }
  };
  
  // List of available citations, use href and header for services
  this.citationList = (dataset) => {
    let list = [{ text: self.citation(dataset, 'apa'), title: 'APA'},
      { text: self.citation(dataset, 'bibtex'), title: 'BibTeX'},
      { text: self.citation(dataset, 'csl'), title: 'CSL JSON'},
    ].sort((a,b) => a.title.localeCompare(b.title));
    if (dataset.citation) {
      list = [{ text: dataset.citation, title: 'Custom'}].concat(list);
    }
    return list;
  };
  
  this.datespans = (dataset) => {
    return (dataset.activity||[]).map(c => {
      let ts = [];
        ts[0] = (/T/).test(c.start) ? c.start.split('T')[0] : '' ;
        ts[1] = (/T/).test(c.stop) ? c.stop.split('T')[0] : '' ;
        return ts;
      }
    );
  };
  
  this.bboxes = (dataset) => {
    return (dataset.coverage||[]).map(c => [c.west, c.south, c.east, c.north]);
  };
  
  this.hasData = (dataset) => {
    return (self.relations(dataset, ['data', 'service']).length > 0);
  }
  
  this.hasAuthors = (dataset) => (self.authors(dataset).length > 0);
  
  this.hasReleaseYear = (dataset) => (/^[0-9]{4}/).test(dataset.released);
  
  this.notices = (dataset) => {
    let i = [];
    
    if (!self.hasData(dataset) && self.hasReleaseYear(dataset)) {
      let now = new Date();
      let released = Date.parse(dataset.released);
      if (now < released) {
        i.push('Planned data release is in the future');
      }
      
    }
    if (dataset.draft === 'yes') {
      i.push('Draft');
    }
    return i;
  }
  
  this.warnings = (dataset) => {
    let w = [];
    
    let hasData = self.hasData(dataset);
    let hasAuthors = self.hasAuthors(dataset);
    let hasReleaseYear = (/^[0-9]{4}/).test(dataset.released);
    let now = new Date();
    let released;
     
    if (hasReleaseYear) {
      released = Date.parse(dataset.released);
    }
    
    //if (hasReleaseYear) {
      //let diff = released-now;
      //if (now < released) {
      //  let days_until_release = parseInt(diff/86400000);
      //  console.log('Data release in', days_until_release, 'days');
      //}
    //}
    
    if (!hasData) {
      if (!hasReleaseYear) {
        w.push('No data');
      } else if (now > released) {
         w.push('No data (even if release date is in the past)');
      }
    }
      
    //if (hasData) {
      // @todo check links!?
    //}
    if (!hasAuthors) {
      w.push('No authors');
    }
    if (!self.publisher(dataset).name) {
       w.push('No publisher');
    }
    if (!hasReleaseYear) {
      w.push('No release date');
    }
    if (!dataset.coverage || dataset.coverage.length === 0) {
      w.push('No geographic coverage');
    }
    if (!dataset.activity || dataset.activity.length === 0) {
      w.push('No timespans');
    }
    if (hasData && dataset.progress === 'planned') {
      w.push('Data is published while progress = "planned"');
    }
    if (dataset.draft === 'yes' && dataset.progress !==  'planned' ) {
      w.push('Draft but progress is set to '+dataset.progress);
    }
    if (!dataset.iso_topics || dataset.iso_topics.length === 0) {
        w.push('No ISO topics');
    }
    if (!dataset.sets || dataset.sets.length === 0) {
        w.push('No sets');
    }
    if (!dataset.topics || dataset.topics.length === 0) {
        w.push('No topics');
    }
    if (dataset.topics.length === 1 && dataset.topics[0] === 'other') {
        w.push('Only "other" is set as topic');
    }
    if (dataset.topics.length > 1 && dataset.topics.includes('other')) {
      w.push('"other" is used addition to other topics');
    }
    if (!dataset.sets || dataset.sets.includes('gcmd.nasa.gov')) {
      if (!dataset.gcmd || !dataset.gcmd.sciencekeywords || dataset.gcmd.sciencekeywords.length === 0)  {
        w.push('No GCMD science keywords');
      }
    }
    if (!dataset.doi) {
      if (w.length > 0) {
        w.push(`No DOI (because of the ${ w.length === 1 ? 'issue' : 'issues' } above)`);
      }
    }
    return w;
  };
}
module.exports = DatasetModel;