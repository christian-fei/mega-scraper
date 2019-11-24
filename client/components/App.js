import * as preact from '/preact.js'
const { Component, h } = preact

export default class App extends Component {
  constructor () {
    super()
    this.state = {
      data: {}
    }
    const eventSource = new window.EventSource('/sse')

    eventSource.onmessage = (message) => {
      if (!message || !message.data) return console.error('skipping empty message')
      message = JSON.parse(message.data)
      const data = message.data
      console.log('data', data)
      this.setState({ data })
    }
  }

  render () {
    const data = this.state.data
    if (!data || Object.keys(data).length === 0) {
      return h('div', null, 'loading...')
    }

    console.log(data.start, data)

    const lastTenScrapedReviews = JSON.parse(data.lastTenScrapedReviews)
    const lastTenScreenshots = JSON.parse(data.lastTenScreenshots)

    return h('div', null, [
      h('div', { className: 'container' }, [
        data.start ? h('div', { className: 'row' }, [
          h('div', { className: 'col m-1' }, [
            h('h6', null, 'start'),
            h('h1', null, new Date(data.start).toISOString())
          ])
        ]) : null,
        data.elapsed ? h('div', { className: 'row' }, [
          h('div', { className: 'col m-1' }, [
            h('h6', null, 'elapsed'),
            h('h1', null, data.elapsed + 'ms')
          ])
        ]) : null,
        h('div', { className: 'w-100' }, []),
        data.finish ? h('div', { className: 'row' }, [
          h('div', { className: 'col m-1' }, [
            h('h6', null, 'finish'),
            h('h1', null, new Date(data.finish).toISOString())
          ])
        ]) : null,
        h('div', { className: 'w-100' }, []),
        data.url ? h('div', { className: 'row' }, [
          h('div', { className: 'col m-1' }, [
            h('h6', null, 'url'),
            h('a', { href: data.url, target: '_blank' }, data.url)
          ])
        ]) : null,
        h('div', { className: 'w-100' }, []),
        data.scrapedReviewsCount ? h('div', { className: 'row' }, [
          h('div', { className: 'col m-1' }, [
            h('h6', null, 'reviews / s'),
            h('h1', null, (+data.scrapedReviewsCount / (+data.elapsed / 1000)).toFixed(1))
          ]),
          h('div', { className: 'col m-1' }, [
            h('h6', null, 'scrapedReviewsCount'),
            h('h1', null, data.scrapedReviewsCount)
          ])
        ]) : null,
        h('div', { className: 'w-100' }, []),
        data.scrapedPages ? h('div', { className: 'row' }, [
          h('div', { className: 'col m-1' }, [
            h('h6', null, 'pages / s'),
            h('h1', null, (+data.scrapedPages / (+data.elapsed / 1000)).toFixed(1))
          ]),
          h('div', { className: 'col m-1' }, [
            h('h6', null, 'scrapedPages'),
            h('h1', null, data.scrapedPages)
          ])
        ]) : null,
        h('div', { className: 'w-100' }, []),
        lastTenScrapedReviews.length > 0 ? h('div', { className: 'row' }, [
          h('h6', null, 'reviews'),
          h('div', { className: '', style: 'min-width: 100%; min-height: 300px; display: flex; overflow-x: auto; ' },
            lastTenScrapedReviews.map(r =>
              h('div', { className: '', style: 'width: 600px; font-size: 0.8rem;; margin: 1em' }, [
                h('div', { className: 'row', style: 'margin: 1em auto;' }, [
                  h('div', { className: '' }, [
                    h('span', { className: 'badge' }, [`${r.stars || 0}⭐️`]),
                    h('br'),
                    h('span', { className: 'badge' }, [r.dateString]),
                    h('br'),
                    h('span', { className: 'badge' }, [`${r.hash && r.hash.substring(0, 10)}..`]),
                    h('br'),
                    r.asin && h('span', { className: 'badge' }, [`asin ${r.asin}`]),
                    r.pageNumber && h('span', { className: 'badge' }, [`page ${r.pageNumber}`]),
                    r.url && h('span', { className: 'badge' }, [h('a', { target: '_blank', href: r.url }, [r.url])])
                  ]),
                  h('br'),
                  h('small', { className: '' }, [
                    r.text && r.text.substring(0, 500)
                  ])
                ])
              ])
            )
          )
        ]) : null,
        h('div', { className: 'w-100' }, []),
        lastTenScreenshots.length > 0 ? h('div', { className: 'container1' }, [
          h('h6', null, 'screenshots'),
          h('div', { className: 'row1', style: 'min-width: 100%; max-height: 600px; display: flex; overflow-x: auto; flex-wrap; no-wrap;' },
            lastTenScreenshots.map(screenshot =>
              h('div', { className: 'col1', style: 'min-width: 250px; margin: 1em' }, [
                h('a', { href: `/screenshots/${screenshot}`, target: '_blank' }, [
                  h('img', { style: 'width: 250px;', src: `/screenshots/${screenshot}` })
                ])
              ])
            )
          )
        ]) : null
      ].filter(Boolean))
    ])
  }
}
