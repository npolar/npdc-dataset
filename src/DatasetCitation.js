'use strict';

function DatasetCitation() {
  'ngInject';
  
  let self = this;
  
  this.isDoi = (str) => {
    return (/^10[.][0-9]+[/].+/).test(str);
  };
  
  // BibTeX
  // Based on http://www.bibtex.org/Format/ and http://citation.datacite.org/format?doi=10.21334/npolar.2016.408e8178&style=bibtex&lang=en-US
  this.bibtex = (param = { type:'@misc', id:'', year:null, title: '', url: '', doi: '', publisher:'', author: null }) => {
    let author;
    if (param.author instanceof Array && param.author.length > 0) {
      author = param.author.map(a => a.name).join(' and ');
    }
    let doi = '';
    if (self.isDoi(param.doi)) {
      doi = `
      DOI="${ param.doi}",`;
    }
    return `@${param.type.replace(/^@/, '')}{${ param.doi || param.id },
      title="${ param.title }",
      url="${ param.url }",
      ${doi}
      publisher="${ param.publisher}",
      author="${ author }",
      year={${ param.year }}}`;
  };
  
  // http://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html
  // https://github.com/citation-style-language/schema/blob/master/csl-data.json
  // https://blog.datacite.org/contributor-information-in-datacite-metadata/
  // Examples:
  // * http://data.datacite.org/application/citeproc+json/10.6084/M9.FIGSHARE.791569
  // * curl -LH "Accept: application/vnd.citationstyles.csl+json" http://dx.doi.org/10.1126/science.169.3946.635
  // * http://api.crossref.org/works/10.1111/1365-2745.12293
  this.csl = (param = { type:'dataset', doi:'', url:'', issued:{}, title: '', publisher:'', author: []}) => {
    function personproc(p) {
      if (p.first_name && p.last_name) {
        return { family: p.last_name, given: p.first_name};
      } else {
        return { literal: p.name };
      }
      
    }
    let author = param.author.map(a => personproc(a));
    let csl = { type: param.type, DOI: param.doi, URL: param.url, title: param.title,
      publisher: param.publisher, issued: param.issued, author
    };
    return csl;
  };
  
  this.apa = (param={ authors:[], year:null, title:'', type:'Data set', publisher:'', uri:''}) => {
    let who = param.authors.map(a => {
      if (a.last_name && a.first_name) { 
        a.initials = a.first_name.split(' ').map(c => c[0]);
        a.apa = `${a.last_name}, ${a.initials.join('. ')+'. '}`.trim();
        if (!a.name) {
          a.name = `${a.first_name} ${a.last_name}`;
        }
        
      } else if (a.name) {
        a.apa = a.name;
      } else {
        a.apa = '';
      }
      return a;
    });
    
    if (who.length === 0) {
      who = '';
    } else if (who.length === 1) {
      who = who[0].apa;
    } else if (who.length >= 2) {
      let last = who.pop();
      if (who.length <= 7) {
        who = who.map(a => a.apa).join(', ').trim() +', & '+ last.apa;
      } else {
        who = who.slice(0,6).map(a => a.apa).join(', ').trim() +', … '+ last.apa;
      }
    }
    
    return `${who} (${param.year}).
      ${ param.title } [${param.type}].
      ${ param.publisher }. ${ param.uri }`;
      
  }; 
}

module.exports = DatasetCitation;