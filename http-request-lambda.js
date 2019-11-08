const AWS = require('aws-sdk')

const region = 'eu-central-1'

const apiVersion = 'latest'
const lambda = new AWS.Lambda({ apiVersion, region })

module.exports = async function ({ url, asin }) {
  const invokeParams = { FunctionName: 'HttpRequestLambda', Payload: JSON.stringify({ url }) }

  return new Promise((resolve, reject) => {
    lambda.invoke(invokeParams, (err, data) => {
      if (err) return reject(err)
      if (data.StatusCode === 200) return resolve({ body: data.Payload, statusCode: data.StatusCode })
      reject(data)
    })
  })
}
