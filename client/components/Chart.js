import * as preact from '/preact.js'
const { Component, h } = preact

export default class Chart extends Component {
  render ({ data }) {
    if (!Array.isArray(data) || data.length < 10) return h('div', { className: 'chart' }, null)
    const height = 80
    const width = 1200
    return h('svg', { width, height, className: 'chart' }, data
      .map((item, i) => {
        const rectHeight = item * height / 100
        return h('rect', {
          width: width / data.length,
          y: height - rectHeight,
          x: i * width / 100,
          height: rectHeight
        })
      }
      )
    )
  }
}
