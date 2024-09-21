const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const { Product, Request } = require('./models');

async function processImages(requestId) {
  const products = await Product.find({ requestId });

  for (const product of products) {
    const outputUrls = [];

    for (const url of product.inputUrls) {
      try {
        // Download image
        const response = await axios({ url, responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');

        // Compress the image by 50%
        const compressedBuffer = await sharp(buffer).jpeg({ quality: 50 }).toBuffer();

        // Save the compressed image locally
        const outputFile = `./compressed/${Date.now()}.jpg`;
        fs.writeFileSync(outputFile, compressedBuffer);

        outputUrls.push(outputFile);  // Add compressed file path to output URLs
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    // Update the product with the output URLs
    await Product.updateOne({ _id: product._id }, { outputUrls });
  }

  // Update request status to completed
  await Request.updateOne({ requestId }, { status: 'completed' });
  notifyWebhook(requestId);
}

// Simulate processing for testing purposes

async function notifyWebhook(requestId) {
  try {
    await axios.post('http://client-webhook-url.com', { requestId, status: 'completed' });
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

module.exports = { processImages, notifyWebhook };
