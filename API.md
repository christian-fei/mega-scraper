## api

### queue

utilities for managing the scraper queue

#### createQueue(queueNameOrUrl, options = {redis_port: 6379, redis_host: '0.0.0.0'})

creates a queue based on redis (bull api) to handle the scraping jobs

```js
const {queue: {createQueue}} = require('mega-scraper')

const wikipediaQueue = createQueue('wikipedia')

const url = 'https://www.wikipedia.org/'
const job = await wikipediaQueue.add({ url })
```

#### getQueueName(url)

generate a unique queue name

something like `scrape_c10307d9-9f43-4f9b-91a0-be96f4c3a2af`

```js
const {queue: {getQueueName, createQueue}} = require('mega-scraper')

const queueName = getQueueName()
const queue = createQueue(queueName)
```

### browser

browser + puppeteer + proxy + screenshot + blocker + stealth utilitlies

#### createBrowser(options)

create a new browser based on puppeteer, with the following options

- proxy: pass each browser request through a free proxy service, defaults to true (can make you less detectable as a scraper)
- headless: use puppeteer in headless mode, defaults to true
- stylesheets: load css files, defaults to true (speeds up scraping)
- javascript: load js files, defaults to true (speeds up scraping)
- images: load images, defaults to true (speeds up scraping)
- blocker: block common trackers and garbage requests, defaults to true (can speed up scraping)
- cookie:  defaults to undefined (can make you less detectable as a scraper)
- width: defaults to 1280
- height: defaults to 800
- slowMo: slow down browser interaction, defaults to undefined (useful when in headful mode)
- timeout: timeout requests, defaults to 5000

```js
const {browser: {createBrowser}} = require('mega-scraper')

const browser = createBrowser()

const page = await browser.newPage('https://www.wikipedia.org/')
```

##### browser.createBrowser.newPage(url, options)

opens a new page, reuses "free" pages by default to use less resources

```js
const browser = createBrowser()

const page = await browser.newPage('https://www.wikipedia.org/', {reusePage: true})
```

#### getPuppeteerOptions(options = {headless: true, slowMo: undefined})

used as internal api.

returns puppeteer options ready to be passed to `puppeteer.launch` and `createBrowser`'s internal api

```js
const {browser: {getPuppeteerOptions}} = require('mega-scraper')

const puppeteerOptions = getPuppeteerOptions()
const instance = await puppeteer.launch(puppeteerOptions)
```

#### preparePage(page, options)

used as internal api.

enhances a puppeteer browser page. supports same `createBrowser` options

```js
const {browser: {preparePage}} = require('mega-scraper')

const instance = await puppeteer.launch(puppeteerOptions)
let page = await instance.page()
page = preparePage(page)
```

#### setBlocker

used as internal api.

enhances a page with blocker functionality. blocks common trackers.

supports `url`, `timeout`, `stylesheets`, `javascript`, `images` options

```js
const {browser: {setBlocker}} = require('mega-scraper')

const instance = await puppeteer.launch(puppeteerOptions)
let page = await instance.page()
page = setBlocker(page)
```


#### setProxy

used as internal api.

enhances a page with proxy functionality. proxies each browser network request through a free proxy service.

supports `url`, `timeout`, `stylesheets`, `javascript`, `images`, `cookie` options

```js
const {browser: {setProxy}} = require('mega-scraper')

const instance = await puppeteer.launch(puppeteerOptions)
let page = await instance.page()
page = setProxy(page)
```

#### setStealth


#### takeScreenshot



### cache
### options
### createServer
### initStatsCache
### scraperFor