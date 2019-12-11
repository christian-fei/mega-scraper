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
### cache
### options
### createServer
### initStatsCache
### scraperFor