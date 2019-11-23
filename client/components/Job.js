import * as preact from '/preact.js'
const { Component, h } = preact

export default class Job extends Component {
  render () {
    const job = this.props
    if (!job) return null
    const { id, progress, finishedOn, processedOn, timestamp, data } = job
    return h('div', { className: `job ${id}`, key: id }, [
      h('span', { className: 'job-id' }, id),
      // h('span', {className: 'job-delay'}, delay),
      h('span', { className: 'job-progress' }, `${progress}%`),
      // h('span', {className: 'job-attempts'}, opts.attempts),
      // h('span', {className: 'job-attempts-made'}, attemptsMade),
      finishedOn && h('span', { className: 'small' }, `took ${humanMS(finishedOn - processedOn)}`),
      h('small', { className: 'small' }, `\t@ ${new Date(timestamp).toISOString()}`),
      Object.keys(data || {}).length > 0 ? h('div', { className: `` }, [
        h('code', { className: 'small' }, `\t${JSON.stringify(data)}`)
      ]) : null
      // \tprocessedOn: ${new Date(processedOn).toISOString()}
      // \tfinishedOn: ${new Date(finishedOn).toISOString()}
      // \tduration: ${humanMS(finishedOn - processedOn)}
    ].filter(Boolean))
  }
}

function humanMS (ms) {
  if (!Number.isFinite(ms)) return ``
  const minutes = ms / (1000 * 60)
  const wholeMinutes = parseInt(minutes, 10)
  const seconds = (minutes - wholeMinutes) * 60
  const wholeSeconds = parseInt(seconds, 10)
  const wholeMillis = parseInt((seconds - wholeSeconds) * 1000, 10)
  let humanString = ``
  if (wholeMinutes > 0) humanString += `${wholeMinutes}m `
  if (wholeSeconds > 0) humanString += `${wholeSeconds}s `
  humanString += `${wholeMillis}ms `
  return humanString
}
