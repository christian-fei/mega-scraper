# mega-scraper

scrape a website's content.

```
npm i -g mega-scraper

mega-scraper https://www.wikipedia.org
```

## requirements

- running redis instance on host 0.0.0.0 port 6379

- on debian/ubuntu, install additional required libraries via `sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget`


### api

[see api.md](./API.md) for more usage example and options.

e.g.

```js
(async () => {
  const {browser: {createBrowser, takeScreenshot}, queue: {createQueue}} = require('.')

  const browser = await createBrowser()
  const queue = createQueue('wikipedia')

  const page = await browser.newPage('https://www.wikipedia.org/')

  const url = 'https://www.wikipedia.org/'
  await queue.add({ url })

  queue.process(async (job) => {
    await page.goto(job.data.url)
    await takeScreenshot(page, job.data)
    const content = await page.content()
    console.log('content', content.substring(0, 500))
  })
})()
```

## cli options

### `--headless` [default: true]

set to `false` to run the scraper in "headful" mode (non-headless)

e.g.

```
mega-scraper https://www.wikipedia.org --headless false
```

### `--screenshot` [default: true]

set to `false` to avoid taking a screenshot of each scraped page

e.g.

```
mega-scraper https://www.wikipedia.org --headless false
```

### `--proxy` [default: true]

set to `false` to avoid proxying each request through a free proxy service (currently the module [`get-free-https-proxy`](https://www.npmjs.com/package/get-free-https-proxy) is used)

e.g.

```
mega-scraper https://www.wikipedia.org --proxy false
```

### `--timeout` [default: 5000]

set the timeout to a desired number in milliseconds (5000 = 5 seconds)

e.g.

```
mega-scraper https://www.wikipedia.org --timeout 10000
```

### `--images` [default: true]

set to `false` to avoid loading images

e.g.

```
mega-scraper https://www.wikipedia.org --images false
```

### `--stylesheets` [default: true]

set to `false` to avoid loading stylesheets

e.g.

```
mega-scraper https://www.wikipedia.org --stylesheets false
```

### `--javascript` [default: true]

set to `false` to avoid loading javascript

e.g.

```
mega-scraper https://www.wikipedia.org --javascript false
```

### `--monitor` [default: true]

set to `false` to avoid opening the web dashboard on localhost:4000

e.g.

```
mega-scraper https://www.wikipedia.org --monitor false
```

### `--exit` [default: false]

set to `true` to exit the program with success or failure status code once done scraping.

e.g.

```
mega-scraper https://www.wikipedia.org --exit
```

### `--cookie` [default: none]

set to a desired cookie to further prevent detection

e.g.

```
mega-scraper https://www.wikipedia.org --cookie 'my=cookie'
```