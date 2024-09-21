const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Product, Request } = require('./models');
const mongoose = require('mongoose');
const { processImages } = require('./worker');  // Import the processImages function

const app = express();
const upload = multer({ dest: 'uploads/' });

mongoose.connect('mongodb+srv://stark:stark@imageprocessing.t8kui.mongodb.net/');

app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const requestId = uuidv4();

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  await Request.create({ requestId, status: 'pending' });

  // Parse CSV
  const products = [];
  fs.createReadStream(file.path)
    .pipe(csv())
    .on('data', async (row) => {
      const { SerialNumber, ProductName, InputImageUrls } = row;
      const inputUrls = InputImageUrls.split(',');
      products.push({
        serialNumber: SerialNumber,
        productName: ProductName,
        inputUrls,
        requestId,
      });
    })
    .on('end', async () => {
      // Save products in the database
      await Product.insertMany(products);
      setTimeout(() => processImages(requestId), 5000);
      res.json({ requestId });
    });
});

app.get("/status/:requestId", async (req, res) => {
  const { requestId } = req.params;
  const request = await Request.findOne({ requestId });

  if (!request) {
    return res.status(404).json({ error: "Request ID not found" });
  }

  res.json({ requestId, status: request.status });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
