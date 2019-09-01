# timelapse-lambda

## installation

### 1. Deploy the [ffmpeg-lambda-layer](https://serverlessrepo.aws.amazon.com/applications/arn:aws:serverlessrepo:us-east-1:145266761615:applications~ffmpeg-lambda-layer) on your Lambda

### 2. Create an S3 bucket

name it, for example, "garden-snapshots" **in the same region as the ffmpeg-lambda-layer**

### 3. Create timelapse lambda

run `./create-aws-lambda` by specifying the needed parameters, below you can find an example.

**in the same region as above!**

```
./create-aws-lambda \
  --region us-east-1 \
  --lambda Timelapse \
  --role arn:aws:iam::XXXXXXXXXXX:role/lambda_name \
  --ffmpeg arn:aws:lambda:us-east-1:XXXXXXXXXXX:layer:ffmpeg:1
```

### 4. update the lambda with the code

specify the region and the lambda name as above and run:

```
./deploy-aws-lambda \
  --region us-east-1 \
  --lambda Timelapse
```

# usage

`npm install` and take a look at `launch-lambda-example.js`:

```js
#!/usr/bin/env node

const AWS = require('aws-sdk')

const region = 'us-east-1'

const apiVersion = 'latest'
const lambda = new AWS.Lambda({ apiVersion, region })
const invokeParams = { FunctionName: 'Timelapse' }

lambda.invoke(invokeParams, (err, data) => {
  console.log(err, data)
})
```