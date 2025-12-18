const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');

// Ensure stats/downloads directory exists
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR);
}

/**
 * Validates a YouTube URL.
 * @param {string} url 
 * @returns {boolean}
 */
const isValidUrl = (url) => {
    return ytdl.validateURL(url);
};

/**
 * Downloads video and audio streams, merges them, and saves the file.
 * @param {string} url - YouTube URL
 * @param {function} onProgress - Callback for progress updates
 * @returns {Promise<string>} - Path to the downloaded file
 */
const downloadVideo = (url, onProgress) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!isValidUrl(url)) {
                return reject(new Error('Invalid YouTube URL'));
            }

            const info = await ytdl.getInfo(url);
            const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '').trim(); // Sanitize title
            const outputPath = path.join(DOWNLOAD_DIR, `${videoTitle}.mp4`);

            // Check if file already exists (optional: skip or overwrite)
            // For this demo, we'll overwrite or let ffmpeg handle it

            console.log(`Starting download for: ${videoTitle}`);

            // streams
            const videoStream = ytdl(url, { quality: 'highestvideo' });
            const audioStream = ytdl(url, { quality: 'highestaudio' });

            // Prepare ffmpeg
            // We use 'pipe:3' and 'pipe:4' or just pass streams directly to fluent-ffmpeg
            // fluent-ffmpeg handles stream inputs gracefully.

            const ffmpegCommand = ffmpeg()
                .input(videoStream)
                .videoCodec('copy')
                .input(audioStream)
                .audioCodec('aac') // Re-encode audio to AAC for better compatibility in MP4 container if needed, or 'copy'
                .format('mp4')
                .outputOptions('-movflags frag_keyframe+empty_moov') // Optimization for validation
                .on('progress', (progress) => {
                    // progress.percent is not always reliable with streams, but timemark is
                    if (onProgress) onProgress(progress);
                })
                .on('error', (err) => {
                    console.error('FFmpeg Error:', err);
                    reject(err);
                })
                .on('end', () => {
                    console.log('Download finished:', outputPath);
                    resolve(outputPath);
                });

            // Save to file
            ffmpegCommand.save(outputPath);

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    downloadVideo,
    isValidUrl
};
