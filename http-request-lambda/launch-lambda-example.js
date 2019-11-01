#!/usr/bin/env node

const AWS = require('aws-sdk')

const region = 'eu-central-1'

const apiVersion = 'latest'
const lambda = new AWS.Lambda({ apiVersion, region })
const url = process.argv[2] || 'https://google.com'
const invokeParams = { FunctionName: 'HttpRequestLambda', Payload: JSON.stringify({ url }) }

lambda.invoke(invokeParams, (err, data) => {
  console.log(err, data)
})
