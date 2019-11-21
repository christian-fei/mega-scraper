# mega-scraper

scrape a website's content.

> built-in support for amazon product reviews.

```
npm i -g mega-scraper

mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/
```

## requirements

- running redis instance on host 0.0.0.0 port 6379 (or with `$REDIS_HOST` and `$REDIS_PORT`) or spin it up with docker

## options

### `--headless` [default: true]

set to `false` to run the scraper in "headful" mode (non-headless)

e.g.

```
mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/ --headless false
```

### `--proxy` [default: true]

set to `false` to avoid proxying each request through a free proxy service

e.g.

```
mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/ --proxy false
```

### `--timeout` [default: 5000]

set the timeout to a desired number in milliseconds (5000 = 5 seconds)

e.g.

```
mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/ --timeout 10000
```

### `--images` [default: true]

set to `false` to avoid loading images

e.g.

```
mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/ --images false
```

### `--stylesheets` [default: true]

set to `false` to avoid loading stylesheets

e.g.

```
mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/ --stylesheets false
```

### `--javascript` [default: true]

set to `false` to avoid loading javascript

e.g.

```
mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/ --javascript false
```


### `--blocker` [default: true]

set to `false` to avoid blocking requests like images, stylesheets, javascript, fonts, etc.

e.g.

```
mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/ --blocker false
```


### `--blocker` [default: default]

set to `true` to exit the program with success or failure status code once done scraping.

e.g.

```
mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/ --exit
```