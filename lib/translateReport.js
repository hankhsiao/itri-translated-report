/**
 * ITRI Newsletter generator
 */

'use strict';

const Converter = require('csvtojson').Converter;
const Handlebars = require('handlebars');
const _ = require('underscore');
const async = require('async');
const fs = require('fs');
const request = require('request');
const shortid = require('shortid');
const translate = require('google-translate-api');

const CONTENT_TO_TRANSLATE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1DP4AGCcQtpHDh18yrSrIxXEYbViJxzuDIVL71f18NEM/export?format=csv';

const TEMPLATE_FILE = __dirname + '/template.htm';

function convertJSON(url, cb) {
  const converter = new Converter({});
  converter.on('end_parsed', data => cb(null, data));
  request.get(url).pipe(converter);
}

function generateID(item) {
  item.id = shortid.generate();
  return item;
}

function highlightFilter(item) {
  return !!item.highlighted;
}

function processData(results) {
  const general = results.general[0];
  const techCategories = results.techCategories.map(item => item.value);
  let conference = results.conference.map(generateID);
  let industry = results.industry.map(generateID);
  let technology = results.technology.map(generateID);
  // highlight are only from industry, technology
  let highlight = [].concat(technology, industry).filter(highlightFilter);

  conference = _.groupBy(_.sortBy(results.conference, item => Date.parse(item.start_date)), 'category');
  industry = _.sortBy(results.industry, item => Date.parse(item.date));
  technology = _.groupBy(_.sortBy(results.technology, item => Date.parse(item.date)), 'category');

  return {
    conference,
    general,
    highlight,
    industry,
    techCategories,
    technology
  };
}

function translateReport(done) {
  let templateHTML = fs.readFileSync(TEMPLATE_FILE).toString();

  convertJSON(CONTENT_TO_TRANSLATE_SHEET_URL, (err, data) => {
    data = data.slice(0, 3);
    async.map(data, (item, cb) => {
      Promise.all([
        translate(item.title, {from: 'en', to: 'zh-tw'}),
        translate(item.content, {from: 'en', to: 'zh-tw'})
      ]).then(values => {
        cb(null, Object.assign(item, {title: values[0].text, content: values[1].text}));
      });
    }, (err, results) => {
      if (err || !results) {
        return;
      }
      const template = Handlebars.compile(templateHTML);
      const output = template({results});
      done && done(output);
    });
  });
}

translateReport();

module.exports = translateReport;
