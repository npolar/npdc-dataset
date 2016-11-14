'use strict';

function DatasetModel($location, $q, NpolarTranslate,
  DatasetCitation, Publication, Project) {
  'ngInject';
  
  let self = this;
  
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
  
  this.findRelated = (dataset, resource) => {
    let relatedDatasets = resource.array({
        q: dataset.title,
        fields: 'id,title,collection',
        score: true,
        limit: 5,
        'not-id': dataset.id,
        op: 'OR'
      }).$promise;
      let relatedPublications = Publication.array({
        q: dataset.title.replace(/\/\"\'\(\)/g, ''),
        fields: 'id,title,published,collection',
        score: true,
        limit: 5,
        op: 'OR'
      }).$promise;
      let relatedProjects = Project.array({
        q: dataset.title,
        fields: 'id,title,collection',
        score: true,
        limit: 5,
        op: 'OR'
      }).$promise;
      return $q.all([relatedDatasets, relatedPublications, relatedProjects]);
  };
  
  this.authors = (dataset) => {

    let authors = [];
    
    if (dataset && dataset.people && dataset.people.length > 0) {
      authors = dataset.people.filter(p => p.roles.includes("author"));
    }
    if (!authors || authors.length === 0) {
      if (dataset && dataset.organisations && dataset.organisations.length > 0) {
        authors = dataset.organisations.filter(o => o.roles.includes("author"));
      }
    }
    return authors;
  };
  
  this.relations = (dataset, rels=['parent','publication','project']) => {
    if (!dataset) { return; }
    return (dataset.links||[]).filter(l => rels.includes(l.rel));
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
      //y = new Date(dataset.created).getFullYear();
    }
    return y;
  };
  
 
  // URI (web address) of the dataset  
  this.uri = (dataset) => {
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
    return [{ text: self.citation(dataset, 'apa'), title: 'APA'},
      { text: self.citation(dataset, 'bibtex'), title: 'BibTeX'},
      { text: self.citation(dataset, 'csl'), title: 'CSL JSON'},
    ].sort((a,b) => a.title.localeCompare(b.title));
  };
  
  this.warnings = (dataset) => {
    let w = [];
    
    let hasData = (self.relations(dataset, ['data', 'service']).length > 0);
    let hasAuthors = (self.authors(dataset).length > 0);
    let hasReleaseYear = (/^[0-9]{4}/).test(dataset.released);
    let now = new Date();
    let released;
     
    if (hasReleaseYear) {
      released = Date.parse(dataset.released);
    }
    
    if (hasReleaseYear) {
      let diff = released-now;
      if (now < released) {
        let days_until_release = parseInt(diff/86400000);
        console.log('Data release in', days_until_release, 'days');
      }
    }
    
    if (!hasData) {
      w.push('No data');
    }
      
    if (!hasData && hasReleaseYear) {
      if (new Date() > released) {
        w.push('Release date is in the past');
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
    if (hasData && dataset.progress === 'planned') {
      w.push('Data is published while progress = "planned"');
    }
    if (dataset.draft === 'yes' && dataset.progress !==  'planned' ) {
      w.push('Draft but progress is set to '+dataset.progress);
    }
    if (dataset.draft === 'yes' || dataset.progress ===  'planned' ) {
      w.push('Planned / draft');
    }
    if (self.authors(dataset).length === 0) {
        w.push('No authors (required to assign DOI)');
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
        w.push('No proper topics');
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