'use strict';

function DatasetModel($location, NpolarTranslate) {
  'ngInject';
  
  this.isNyÅlesund = () => {
    return (/\/ny\-[åa]lesund\//).test($location.path());
  };
  
  this.getAppTitle = () => {
    if (this.isNyÅlesund()) {
      return [
        {'@language': 'en', '@value': 'Ny-Ålesund datasets'},
        {'@language': 'no', '@value': 'Ny-Ålesund datasett'}
      ];
    } else {
      return [
        {'@language': 'en', '@value': 'Datasets'},
        {'@language': 'no', '@value': 'Datasett'}
      ];
    }
    
  };
  
  this.authors = (dataset) => {

    var folks = [];
    var orgs = [];

    if (dataset.people instanceof Array) {
      folks = dataset.people.filter(p => p.roles.includes("author"));
    }

    if (folks.length === 0 && dataset.organisations instanceof Array) {
      orgs = dataset.organisations.filter(o => o.roles.includes("author"));
    }
    return folks.concat(orgs);

  };

  this.author_names = (dataset) => {
    var et_al_suffix = "";
    var all_authors = this.authors(dataset);
    if (all_authors.length > 5) {
      all_authors = [all_authors[0]];
      et_al_suffix = " et al";
    }
    var names = all_authors.map(a => {
      return a.hasOwnProperty("name") ? a.name : `${a.first_name[0]} ${a.last_name}`;
    });
    return names.join(", ") + et_al_suffix;
  };
  
  this.publisher = (dataset) => {
    let p = (dataset.organisations||[]).find(o => o.roles.includes("publisher"));

    if (p) {
      return p;
    } else {
      return {};
    }
  };
  
  this.published_year = (dataset) => {
    let y = "not-yet released";
    if ((/^\d{4}\-/).test(dataset.released)) {
      y = new Date(dataset.released).getFullYear();
    }
    return y;
  };
  
   
 this.uri = (dataset) => {
  if (!dataset.links) {
      dataset.links = [];
  }
  // Use DOI if set
  let link = dataset.links.find(l => l.rel === "doi");
  if (link) {
    // normalize DOI
    return link.href;
  }
    
  link = (dataset.links||[]).find(l => {
      return l.rel === "alternate" && (/html$/).test(l.type);
    });
    link = (dataset.links||[]).find(l => {
      return l.rel === "alternate" && (/html$/).test(l.type);
    });
    if (link) {
      return link.href.replace(/^http:/, "https:");
    } else {
      return `https://data.npolar.no/dataset/${ dataset.id }`;
    }
  };

  // Citation string
  this.citation = (dataset) => {
    let citation = '';
    
    if (dataset.citation && dataset.citation.length > 0) {
      return dataset.citation;
    }

    if ((/^(Norwegian Polar Institute|Norsk Polarinstitutt)$/).test(this.author_names(dataset))) {
      citation = `${ dataset.title } (${ this.published_year(dataset) }). ${ this.publisher(dataset).name}`;    
      citation += ` (Tromsø, Norway):`;
    } else {
      citation = `${ this.author_names(dataset) } (${ this.published_year(dataset) }). `;
      citation += `${ dataset.title }. ${ this.publisher(dataset).name }`;
    }
    citation += ' '+ this.uri(dataset);
    
    return citation;
  }; 
}
module.exports = DatasetModel;
