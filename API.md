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

#### getQueueName

### browser
### cache
### options
### createServer
### initStatsCache
### scraperFor