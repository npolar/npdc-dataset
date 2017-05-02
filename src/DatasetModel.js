'use strict';

function DatasetModel($location, $q, $http, $filter,
  NpolarApiSecurity,
  NpdcDOI, NpdcCitationModel) {
  'ngInject';

  let self = this;

  this.schema = '//api.npolar.no/schema/dataset-1';

  this.file_server = (base, id=':id') => `${base}/${id}/_file`;

  this.data_link = (dataset, base, param={filename:'_all',

    title: dataset.doi.split('/')[1]||`npolar-dataset-${dataset.id}`,
    rel: 'data',
    format: 'zip',
    file_server: self.file_server(base, dataset.id)
  }) => {
    let rel = encodeURIComponent(param.rel);
    let format = encodeURIComponent(param.format);
    let title = encodeURIComponent(param.title+'.'+param.format);
    let type =  encodeURI(`application/${param.format}`);
    let filename = encodeURIComponent(param.filename);
    let file_server = encodeURI(param.file_server);
    let href = `${file_server}/${filename}?filename=${title}&format=${format}`;
    let formats = ['zip', 'gzip'];
    if (!formats.includes(format)) {
      console.error(`Format ${format} not supported by the file server, only: ${ JSON.stringify(formats)}`);
    }
    return { rel, href, title, type };
  };

  this.hasMagicDataLink = (dataset, base) => {
    return ((dataset.links||[]).findIndex(l => {
      let m = l.rel === 'data' && (new RegExp(self.file_server(base, dataset.id))).test(l.href);
      console.log('hasMagicDataLink', (m.length > 0) );
      return (m);
    }) > 0);
  };

  this.isNyÅlesund = () => {
    return (/\/ny\-[åa]lesund\//).test($location.path());
  };

  this.getAppTitle = () => {
    if (self.isNyÅlesund()) {
      return [{
        '@language': 'en',
        '@value': 'Ny-Ålesund  datasets'
      }, {
        '@language': 'no',
        '@value': 'Ny-Ålesund  datasett'
      }];
    } else {
      return [{
        '@language': 'en',
        '@value': 'Dataset  catalogue'
      }, {
        '@language': 'no',
        '@value': 'Datasett'
      }];
    }
  };

  this.suggestions = (
    dataset,
    resource,
    param = {
      title: dataset.title,
      id: dataset.id,
      limit: 100,
      min_score: 0.45,
      fields: 'id,title,collection,updated',
      prune: (title) => {
        return title.replace(/\/\"\'\(\)/g, '');
      }
    }) => {
    return new Promise((resolve, reject) => {
      resource.array({
        q: param.prune(param.title),
        fields: param.fields,
        score: true,
        limit: param.limit,
        'not-id': param.id,
        op: 'OR'
      }, datasets => {
        resolve(datasets.filter(d => d._score >= param.min_score));
      }, error => {
        reject(error);
      });
    });
  };

  this.metadata = (dataset, resource, uri) => {
    let path = resource.path.replace('//api.npolar.no', '');
    // @todo i18n
    let byline = $filter('i18n')('byline.dataset_catalogue');

    let schema = self.schema;
    return {
      uri,
      path,
      formats: self.alternateLinks(dataset),
      editors: [],
      byline,
      schema
    };
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
        title: 'DCAT  (JSON-LD)',
        type: 'application/ld+json'
      });

    }

    if (NpdcDOI.isDoi(dataset.doi)) {
      formats.push({
        href: `//data.datacite.org/application/vnd.datacite.datacite+xml/${dataset.doi}`,
        title: 'Datacite  XML',
        type: 'vnd.datacite.datacite+xml'
      });
      // For debugging DOIs
      //formats.push({
      //  href:  `http://hdl.handle.net/api/handles/${dataset.doi}`,
      //  title:  'handle.net  JSON',
      //  type:  'application/json'
      //});
    }
    return formats;
  };

  this.relations = (links = [], rels = ['parent', 'publication', 'project', 'metadata', 'expedition']) => {
    if (!links) {
      return;
    }
    if (links.links) {
      links = links.links;
    }
    return links.filter(l => rels.includes(l.rel));
  };

  this.rel = (dataset, rel) => {
    if (!dataset) {
      return;
    }
    let r = self.relations(dataset, [rel]);
    if (r[0]) {
      rel = r[0];
      rel['@id'] = rel.href;
      return rel;
    }
  };


  this.publisher = (dataset) => {
    let p = (dataset.organisations || []).find(o => o.roles.includes("publisher"));
    if (p) {
      return p;
    } else {
      return {};
    }
  };

  this.published_year = (dataset) => {
    let y;
    if (dataset && dataset.released && (/^\d{4}/).test(dataset.released)) {
      y = new Date(dataset.released).getFullYear();
    } else {
      y = "not  released";
    }
    return y;
  };

  this.datespans = (dataset) => {
    return (dataset.activity || []).map(c => {
      let ts = [];
      ts[0] = (/T/).test(c.start) ? c.start.split('T')[0] : '';
      ts[1] = (/T/).test(c.stop) ? c.stop.split('T')[0] : '';
      return ts;
    });
  };

  this.bboxes = (dataset) => {
    return (dataset.coverage || []).map(c => [c.west, c.south, c.east, c.north]);
  };

  this.hasData = (dataset) => {
    return (self.relations(dataset, ['data', 'service']).length > 0);
  };

  this.hasAuthors = (dataset) => NpdcCitationModel.authors(dataset).length > 0;

  this.hasReleaseYear = (dataset) => (/^[0-9]{4}/).test(dataset.released);

  this.notices = (dataset) => {
    let i = [];

    if (self.hasReleaseYear(dataset)) {
      let now = new Date();
      let released = Date.parse(dataset.released);
      if (now < released) {
        i.push('Planned  data  release  is  in  the  future');
      }

    }
    if (dataset.draft === 'yes') {
      i.push('Draft');
    }
    console.log('Notices', i);
    return i;
  };

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

    // Left for future @todo
    //if  (hasReleaseYear)  {
    //let  diff  =  released-now;
    //if  (now  <  released)  {
    //  let  days_until_release  =  parseInt(diff/86400000);
    //  console.log('Data  release  in',  days_until_release,  'days');
    //}
    //}

    if (!dataset.summary || dataset.summary === 'MISSING') {
      w.push("No summary");
    }

    if (!hasData) {
      if (!hasReleaseYear) {
        w.push('No data');
      } else if (now > released) {
        w.push('No data  (even  if  release  date  is  in  the  past)');
      }
    }

    //if  (hasData)  {
    //  @todo  check  links!? => would require Promise...
    //}
    if (!hasAuthors) {
      w.push('No authors');
    }
    if (!self.publisher(dataset).name) {
      w.push('No publisher');
    }
    if (!hasReleaseYear) {
      w.push('No release  date');
    }
    if (!dataset.coverage || dataset.coverage.length === 0) {
      w.push('No geographic  coverage');
    }
    if (!dataset.activity || dataset.activity.length === 0) {
      w.push('No timespans');
    }
    if (hasData && dataset.progress === 'planned') {
      w.push('Data  is  published  while  progress  =  "planned"');
    }
    if (dataset.draft === 'yes') {
      w.push('Draft');
    }
    if (!dataset.iso_topics || dataset.iso_topics.length === 0) {
      w.push('No ISO  topics');
    }
    if (!dataset.sets || dataset.sets.length === 0) {
      w.push('No sets');
    }
    if (!dataset.topics || dataset.topics.length === 0) {
      w.push('No topics');
    }
    // I guess other is legit, or?
    //if (dataset.topics.length === 1 && dataset.topics[0] === 'other') {
    //  w.push('Only  "other"  is  set  as  topic');
    //}
    if (dataset.topics.length > 1 && dataset.topics.includes('other')) {
      w.push('"other" is used addition to other topics');
    }
    if (!dataset.sets || dataset.sets.includes('gcmd.nasa.gov')) {
      if (!dataset.gcmd || !dataset.gcmd.sciencekeywords || dataset.gcmd.sciencekeywords.length === 0) {
        w.push('No GCMD science keywords');
      }
    }
    if (!dataset.doi) {
      if (w.length > 0) {
        w.push(`No DOI (because of the ${  w.length  ===  1  ?  'issue'  :  'issues'  }  above)`);
      }
    }
    console.log('Warnings', w);
    return w;
  };

  this.linksFromHashi = (hashi, dataset) => {

      let href = hashi.url;
      if ((/\/[0-9a-f]{32,}$/i).test(hashi.url)) {
        href = hashi.url.split('/');
        href.pop();
        href = encodeURI(`${ href.join('/') }/${ encodeURIComponent(hashi.filename) }`);
      }

      let a = {
        href,
        rel: "data",
        license: dataset.license||dataset.licences[0],
        title: hashi.filename,
        integrity: `md5-${hashi.md5sum}`,
        hash: `md5:${hashi.md5sum}`,
        type: hashi.content_type,
        length: hashi.file_size,
        modified: hashi.modified
      };
      return a;
  };
}
module.exports = DatasetModel;