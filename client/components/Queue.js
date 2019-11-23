import * as preact from '/preact.js'
import Job from '/components/Job.js'
import Chart from '/components/Chart.js'
const { Component, h } = preact

export default class Queue extends Component {
  render () {
    const { queue, state, updateState } = this.props
    if (!queue) return
    return h('div', { className: `queue queue-${queue.name}` }, [
      h('div', { className: 'queue-name' }, [
        h('h1', null, queue.name),
        h(Chart, { data: chartFor(queue.completed) })
      ]),
      h('div', { className: 'queue-types' }, [
        ['active', 'completed', 'failed', 'waiting', 'delayed'].map(type => h('div', {
          onClick: () => updateState({ showQueue: queue.name, showQueueType: type })
        }, [
          h('span', { className: 'queue-type-name' }, [type]),
          h('span', { className: `queue-type-count updated queue-${type}-count` }, [queue[`${type}Length`]])
        ]))
      ]),
      (state.showQueueType === 'completed' && state.expanded) ? h('div', { className: '' }, [
        h('div', { className: 'expand-collapse-jobs' }, [
          h('span', {
            onClick: () => updateState({ expanded: false })
          }, state.expanded ? 'collapse' : null)
        ])
      ]) : null,
      h('div', { className: 'queue-details' }, [
        h('div', { className: `queue-preview ${state.expanded && 'expanded'}` },
          queue[`${state.showQueueType}Length`] && queue[`${state.showQueueType}Length`] > 0 ? [
            h('ul', { className: '' },
              queue[state.showQueueType].map(job => h(Job, job))
            )
          ] : [
            h('div', { className: 'empty-queue' }, [
              `Empty "${state.showQueueType}" jobs`
            ])
          ])
      ].filter(Boolean)),
      (state.showQueueType === 'completed') ? h('div', { className: '' }, [
        h('div', { className: 'expand-collapse-jobs' }, [
          h('span', {
            onClick: () => updateState({ expanded: !state.expanded })
          }, state.expanded ? 'collapse' : 'expand')
        ])
      ]) : null
    ])
  }
}

function chartFor (jobs) {
  const filtered = jobs.filter(Boolean).filter(job => Number.isFinite(job.finishedOn) && Number.isFinite(job.processedOn))
  const durations = filtered.map(job => job.finishedOn - job.processedOn)
  const max = Math.max(...durations)
  const min = Math.min(...durations)
  const delta = max - min
  return durations.map(d => {
    return (d - min) / delta * 1000
  })
}
