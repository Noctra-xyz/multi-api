/**
 * @swagger
 * /transcript:
 *   post:
 *     summary: Generates HTML transcripts for Discord tickets.
 *     description: |
 *       This endpoint is reserved for special use cases.
 *
 *       **Note**: The details of this endpoint are not provided in the Swagger documentation.
 *
 *
 *       **Important**: Use this endpoint with caution and ensure you have the necessary knowledge and understanding before utilizing it.
 *     responses:
 *       200:
 *         description: Successful request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Placeholder response
 *                   example: "This is a placeholder response"
 */

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const cheerio = require('cheerio');
const isBanned = require('../banned.js');

// Initialize the S3 client for MinIO
const s3Client = new S3Client({
    region: 'us-east-1',  // This can be any string as MinIO ignores this value
    endpoint: 'https://minio-qkscss8kgowgs88sg00ocoko.noctra.xyz', // Your MinIO server URL
    credentials: {
        accessKeyId: 'ziOOBIB8WCI16sY56ZSS',        // Your MinIO access key
        secretAccessKey: 'ZBtJ88m3pgf1HyrrEeGaTHcsvbqtWzsc3QLu3yTT', // Your MinIO secret key
    },
    forcePathStyle: true, // This ensures compatibility with MinIO
});

const transcript = async (req, res) => {
    const { serverid, channelid, messageid, content, close, channelname, user, usericon, eventtype, emoji } = req.body;
    const bucketName = 'transcripts'; // Use the correct bucket name
    const s3Key = `transcripts/${serverid}-${channelid}.html`;
    const timeNow = new Date();

    // Construct the MinIO URL
    const url = `https://minio-qkscss8kgowgs88sg00ocoko.noctra.xyz/${bucketName}/${s3Key}`;

    if (!serverid || !channelid) {
        res.status(400).json({ error: 'Missing required parameters. Please ensure you are using serverid and channelid parameters in all requests' });
        return;
    } else if (typeof serverid === 'number' || typeof channelid === 'number' || typeof messageid === 'number') {
        console.log(`User attempted to transcript without quotes - ServerID: ${serverid}`);
        return res.status(400).json({ error: 'Serverid or channelid or messageid missing "" (quotes) in value.' });
    }

    const banned = await isBanned(serverid);
    if (banned) {
        console.log(`BANNED USER: ${serverid}`);
        return res.status(401).json({ error: 'You are banned from using this endpoint.' });
    }

    console.log(`Server ID: ${serverid}, Channel ID: ${channelid}`);
    try {
        // Retrieve the existing transcript file from MinIO
        let existingContent = '';
        try {
            const getObjectCommand = new GetObjectCommand({ Bucket: bucketName, Key: s3Key });
            const existingObject = await s3Client.send(getObjectCommand);

            // Stream and collect the existing content
            const chunks = [];
            existingObject.Body.on('data', (chunk) => {
                chunks.push(chunk);
            });

            existingObject.Body.on('end', () => {
                existingContent = Buffer.concat(chunks).toString();
                proceedWithTranscriptUpdate();
            });
        } catch (error) {
            if (error.name === 'NoSuchKey') {
                console.log("Creating a new transcript file as it doesn't exist.");
                existingContent = ''; // Initialize as empty since there's no existing content
                proceedWithTranscriptUpdate();
            } else {
                throw error; // If there's an error other than the file not existing, rethrow it
            }
        }

        const proceedWithTranscriptUpdate = async () => {
            const $ = cheerio.load(existingContent, { decodeEntities: false });
            let updatedContent;
            let match = false;

            if (!eventtype) {
                // Check if messageid exists in the existing content
                const messageSelector = `.messages .msg:has(.hidden:contains(${messageid}))`;
                const messageElement = $(messageSelector);

                if (messageElement.length > 0) {
                    // If messageid exists, update the content of the message
                    const editedContent = `<p><strong><font color="#fcba03">Message was edited:</font></strong> ${content}</p>`;
                    const lastEditElement = messageElement.find('.right p:contains("Message was edited:")').last();

                    if (lastEditElement.length > 0) {
                        lastEditElement.after(editedContent);
                    } else {
                        messageElement.find('.right p').last().after(editedContent);
                    }
                    match = true;
                }
            } else if (eventtype === 'delete') {
                // Check if messageid exists in the existing content
                const messageSelector = `.hidden:contains(${messageid})`;
                const messageElement = $(messageSelector);

                if (messageElement.length > 0) {
                    // If messageid exists and eventtype = delete, mark the message as deleted
                    const editedContent = `<p><strong><font color="#f0210a">This message was deleted.</font></strong></p>`;
                    messageElement.after(editedContent);
                    match = true;
                }
            } else if (eventtype === 'reaction') {
                // Check if messageid exists in the existing content
                const messageSelector = `.hidden:contains(${messageid})`;
                const messageElement = $(messageSelector);

                if (messageElement.length > 0) {
                    // If messageid exists and eventtype = reaction, mark the message as being reacted to
                    const editedContent = `<p><strong><font color="#72d92e">A reaction was added by ${user}: ${emoji}</font></strong></p>`;
                    messageElement.after(editedContent);
                    match = true;
                }
            }

            if (!match) {
                const newMessageContent = `
                    <div class='msg'>
                      <div class='left'><img src='${usericon}'></div>
                      <div class='right'>
                        <div><a>${user}</a><a>${timeNow}</a></div>
                        <p>${content}</p>
                        <span class='hidden'>${messageid}</span>
                      </div>
                    </div>
                `;
                $('.messages').append(newMessageContent);
            }

            updatedContent = $.html();

            // Upload the updated content to MinIO
            const putObjectCommand = new PutObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
                Body: updatedContent,
                ContentType: 'text/html; charset=utf-8',
            });
            await s3Client.send(putObjectCommand);

            if (close) {
                res.json({ message: 'Transcript closed and updated.', url });
            } else {
                res.json({ message: 'Transcript updated.', url });
            }
        };
    } catch (error) {
        console.error('Error updating transcript:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { transcript };
