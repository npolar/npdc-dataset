'use strict';

function DatasetCitation($location, NpdcDOI, NpdcCitationModel, NpdcAPA, NpdcBibTeX) {
  'ngInject';

  let self = this;

  this.isNyÅlesund = () => {
    return (/\/ny\-[åa]lesund\//).test($location.path());
  };

  // URI (web address) of the dataset
  this.uri = (dataset) => {

    if (!dataset) { return; }

    // Use DOI if set
    if (dataset.doi && NpdcDOI.isDoi(dataset.doi)) {
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

  // List of available citations, use href and header for services
  this.citationList = (dataset) => {

    let list = [
        { text: self.citation(dataset, 'apa'), title: 'APA'},
        { text: self.citation(dataset, 'bibtex'), title: 'BibTeX'},
        { text: self.citation(dataset, 'csl'), title: 'CSL JSON'}
    ];
    if (dataset.doi) {
      //{ href: `//data.datacite.org/application/x-bibtex/${dataset.doi}`, title: 'BibTeX (Datacite)'},
      list.push({ href: `//data.datacite.org/application/x-research-info-systems/${dataset.doi}`,
        title: 'RIS',
        header: [{ 'Accept': 'application/x-research-info-systems'}]
      });
    }

    list = list.sort((a,b) => a.title.localeCompare(b.title));

    if (dataset.citation) {
      list = [{ text: dataset.citation, title: 'Custom'}].concat(list);
    }
    return list;
  };

  // Citation helper
  this.citation = (dataset, style) => {
    if (!dataset) {
      return;
    }

    let authors = NpdcCitationModel.authors(dataset);
    let author = authors;
    let year = NpdcCitationModel.published_year(dataset);
    //let published = NpdcCitationModel.published(dataset);
    let title = dataset.title;
    let type;
    let pub = NpdcCitationModel.publisher(dataset);
    let publisher = pub.name || pub.id;
    let uri = self.uri(dataset);
    let url = uri;
    let doi = dataset.doi;

    if ((/apa/i).test(style)) {
      type = 'Data set';
      return NpdcAPA.citation({ authors, year, title, type, publisher, uri });
    } else if ((/bibtex/i).test(style)){
      type = '@misc';
      return NpdcBibTeX.bibtex({ title, url, doi, type, publisher, author, year, id: dataset.id });
    } else if ((/csl/i).test(style)){
      type = 'dataset';
      let issued = { 'date-parts': [year] };
      return self.csl({ type, DOI: doi, URL: url, title, publisher, issued, author });
    } else {
      throw `Uknown citation style: ${style}`;
    }
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
    return JSON.stringify(csl, null, 2);
  };
}

module.exports = DatasetCitation;
