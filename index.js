const express = require('express');
const cors = require('cors');
const { downloadVideo, isValidUrl } = require('./downloader');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow all CORS for this local tool
app.use(express.json());

// Check if ffmpeg is installed/available
// In a real scenario, we might want to check this on startup.

// Routes
app.post('/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!isValidUrl(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`Received download request for: ${url}`);

    // Since this is a simple demo, we will wait for the download to finish.
    // For a production app, we would return a job ID and use web sockets or polling.
    // We'll trust the user to wait a bit.

    try {
        const filePath = await downloadVideo(url, (progress) => {
            // Optional: Log progress specifically
            // console.log('Processing:', progress.timemark); 
        });

        res.json({ success: true, message: 'Download completed', path: filePath });
    } catch (error) {
        console.error('Download failed:', error);
        res.status(500).json({ error: 'Download failed', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`YouTube Downloader Backend running at http://localhost:${PORT}`);
    console.log('Ensure ffmpeg is in your system PATH.');
});
