#!/usr/bin/env node

const amazon = require('./amazon')

main(process.argv[2], process.argv[3])
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

async function main (asin, pageNumber = 1) {
  let productReviews = []
  const allReviews = []
  do {
    console.log(`scraping page ${pageNumber} for asin ${asin}`)
    productReviews = await amazon.getProductReviews({ asin, pageNumber })
    console.log(`found ${productReviews && productReviews.length} product reviews on page ${pageNumber} for asin ${asin}`)
    // console.log('productReviews', productReviews)
    pageNumber++
    allReviews.push(...productReviews)
    console.log(`total reviews ${allReviews.length}`)
    // productReviews.forEach(p => console.log(p))
  } while (productReviews && productReviews.length > 0)
}
