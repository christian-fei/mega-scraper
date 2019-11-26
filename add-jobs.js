#!/usr/bin/env node
const debug = require('debug')
debug.enable('mega-scraper:*')
const log = debug('mega-scraper:add-job')
const { createQueue } = require('./lib/queue')
const { addJob } = require('./add-job')

if (require.main === module) {
  addJobs()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))

  process.on('unhandledRejection', err => log(err.message, err))
  process.on('uncaughtException', err => log(err.message, err))
} else {
  module.exports = { addJobs }
}

async function addJobs () {
  const urls = [
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=1',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=2',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=3',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=4',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=5',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=6',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=7',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=8',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=9',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=10',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=11',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=12',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=13',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=14',
    'https://www.amazon.it/product-reviews/B07PHPXHQS/?pageNumber=15'
  ]
  log('add jobs', urls)
  const queue = createQueue('scraper')
  return Promise.all(urls.map(url => addJob(url, queue)))
}
