# mega-scraper

scrape a website's content.

```
npm i -g mega-scraper

mega-scraper https://www.amazon.com/PlayStation-4-Slim-1TB-Console/dp/B071CV8CG2/
```

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
