const test = require('ava')
const amazonGeneric = require('./amazon.generic')
const EventEmitter = require('events')
const { createQueue } = require('../queue')
const createBrowser = require('../create-browser')
const cookie = 'session-id=259-9268644-3504803; i18n-prefs=EUR; ubid-acbit=260-3182255-7077241; session-id-time=2082758401l; x-wl-uid=1C689oI7f04YDEt6bEXciPtsYRANbrM0kRbxhqJoqOBdUq7RL8hP6ie8nOSpMHaPVZaumWt1xLJU=; session-token=xOcf5ZHInskXOfPUs0EYyIi0Lr01bJvBnk9DwPmpd2oI4zW0SWvPirFsoL22+SFpR+dBd1/tb97YiYmKb/9a7Z5qrm5vB3RhVRZL25Q0r8MI6JAdLwnLhihXaQ1XGXVyYTIfdLyKI3WvGZTXBL93Iv0JXtm1wGiJ+0z0GbPt4I3KSIXmAaE6J++4qTh0LSmzbxkt0SC3v+ZvrN5g8zXaP90+kw1nD2KI6jLizF/CGo5Ux5BwkSxHBA==; csm-hit=tb:XJT0X90M5FW9N1ZVFMBC+s-XJT0X90M5FW9N1ZVFMBC|1574450743066&t:1574450743066&adb:adblk_no'

test('scrapes url https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/', async t => {
  const events = new EventEmitter()
  const queue = createQueue('test_amazon_generic')
  const browser = await createBrowser({ headless: true, proxy: true, images: false, javascript: false, stylesheets: false, cookie })

  amazonGeneric({ url: 'https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/', toPage: 5, queue, events, browser })

  const scrapedReviews = []
  return new Promise((resolve, reject) => {
    events.on('review', (review) => {
      scrapedReviews.push(review)
      t.truthy(review)
    })
    events.on('done', (result) => {
      t.is(result.toPageReached, true)
      t.is(result.toPage, 5)
      t.is(scrapedReviews.length, 50)
      resolve(result)
    })
  })
})
