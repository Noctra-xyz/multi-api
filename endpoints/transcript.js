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

const Minio = require('minio');
const cheerio = require('cheerio');
const isBanned = require('../banned.js');

// MinIO client configuration
const minioClient = new Minio.Client({
  endPoint: 'console-qkscss8kgowgs88sg00ocoko.noctra.xyz',
  port: 443,
  useSSL: true,
  accessKey: 'ziOOBIB8WCI16sY56ZSS',
  secretKey: 'ZBtJ88m3pgf1HyrrEeGaTHcsvbqtWzsc3QLu3yTT',
});

// Endpoint to add content to transcripts
const transcript = async (req, res) => {
  const { serverid, channelid, messageid, content, close, channelname, user, usericon, eventtype, emoji } = req.body;
  const bucketName = 'transcripts'; // Ensure the bucket name is correct
  const s3Key = `${serverid}-${channelid}.html`;
  const timeNow = new Date();
  const url = `https://console-qkscss8kgowgs88sg00ocoko.noctra.xyz/${bucketName}/${s3Key}`;

  if (!serverid || !channelid) {
    return res.status(400).json({ error: 'Missing required parameters. Please ensure you are using serverid and channelid parameters in all requests' });
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
    let existingContent = '';
    try {
      const getObjectStream = await minioClient.getObject(bucketName, s3Key);
      const chunks = [];
      getObjectStream.on('data', (chunk) => chunks.push(chunk));
      getObjectStream.on('end', () => {
        existingContent = Buffer.concat(chunks).toString();
      });
    } catch (err) {
      if (err.message.includes('The specified key does not exist')) {
        existingContent = '';
      } else {
        throw err;
      }
    }

    const $ = cheerio.load(existingContent, { decodeEntities: false });
    let updatedContent;
    let match = false;

    if (!eventtype) {
      const messageSelector = `.messages .msg:has(.hidden:contains(${messageid}))`;
      const messageElement = $(messageSelector);

      if (messageElement.length > 0) {
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
      const messageSelector = `.hidden:contains(${messageid})`;
      const messageElement = $(messageSelector);

      if (messageElement.length > 0) {
        const editedContent = `<p><strong><font color="#f0210a">This message was deleted.</font></strong></p>`;
        messageElement.after(editedContent);
        match = true;
      }
    } else if (eventtype === 'reaction') {
      const messageSelector = `.hidden:contains(${messageid})`;
      const messageElement = $(messageSelector);

      if (messageElement.length > 0) {
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

    await minioClient.putObject(bucketName, s3Key, updatedContent, 'text/html; charset=utf-8');

    if (close) {
      res.json({ message: 'Transcript closed and updated.', url });
    } else {
      res.json({ message: 'Transcript updated.', url });
    }
  } catch (error) {
    console.error(`Error updating transcript: ${error.message}`);
    return res.status(500).json({ error: 'Failed to update transcript.' });
  }
};

module.exports = transcript;
