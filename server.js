const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Set up Multer for handling file uploads in memory
const upload = multer({
  limits: {
    fileSize: 4 * 1024 * 1024, // 4 MB limit
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Received file: ${req.file.originalname} (${req.file.size} bytes)`);

    if (!process.env.PINATA_JWT) {
      console.error('PINATA_JWT is not set in .env');
      return res.status(500).json({ error: 'Pinata configuration missing' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const pinataOptions = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', pinataOptions);

    console.log('Uploading to Pinata...');
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      }
    });

    console.log('Successfully pinned to Pinata! CID:', response.data.IpfsHash);

    return res.status(200).json({
      cid: response.data.IpfsHash,
      size: response.data.PinSize,
      name: req.file.originalname
    });

  } catch (error) {
    console.error('Error uploading to Pinata:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to upload to IPFS' });
  }
});

// For metadata JSON upload
app.post('/api/upload-json', async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: 'No JSON data provided' });
    }

    if (!process.env.PINATA_JWT) {
      console.error('PINATA_JWT is not set in .env');
      return res.status(500).json({ error: 'Pinata configuration missing' });
    }

    console.log('Uploading JSON metadata to Pinata...');
    const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      }
    });

    console.log('Successfully pinned JSON! CID:', response.data.IpfsHash);

    return res.status(200).json({
      cid: response.data.IpfsHash,
      size: response.data.PinSize
    });

  } catch (error) {
    console.error('Error uploading JSON to Pinata:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to upload JSON to IPFS' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Upload API Server running on http://localhost:${PORT}`);
});
