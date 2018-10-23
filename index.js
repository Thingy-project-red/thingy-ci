require('dotenv').config();
const http = require('http');
const webhook = require('github-webhook-handler')({
  path: '/', secret: process.env.CI_SECRET
});
const exec = require('await-exec');
const request = require('request-promise-native');

async function sendTelegram(message) {
  // Only send message if Telegram is configured
  if (process.env.CI_TG_KEY && process.env.CI_TG_CHAT) {
    console.log('Informing user on Telegram');
    const apikey = process.env.CI_TG_KEY;
    const uri = `https://api.telegram.org/bot${apikey}/sendMessage`;
    await request({
      method: 'POST',
      uri,
      body: { chat_id: process.env.CI_TG_CHAT, text: message },
      json: true
    });
  }
}

http.createServer((req, res) => {
  webhook(req, res, () => {
    res.statusCode = 404;
    res.end('No such location');
  });
}).listen(process.env.CI_PORT);

webhook.on('error', (err) => {
  console.error('Error:', err.message);
});

webhook.on('push', async (event) => {
  // Isolate branch from remote ref
  const hookBranch = event.payload.ref.split('/')[2];
  console.log(`Received a push event for branch ${hookBranch}`);
  // Only continue if we're watching this branch
  if (hookBranch === process.env.CI_BRANCH) {
    try {
      // Attempt git pull
      console.log(`Doing git pull on branch ${process.env.CI_BRANCH}`);
      await exec(
        `cd ${process.env.CI_DIR} && \
        git checkout ${process.env.CI_BRANCH} && \
        git pull`
      );

      // Attempt docker-compose
      console.log('Running docker-compose');
      await exec(`cd ${process.env.CI_DIR} && docker-compose up -d --build`);

      console.log('New version deployed successfully');
      // All went well, try to send Telegram message
      await sendTelegram('New version deployed');
    } catch (err) {
      console.error(`Unable to deploy\n${err.stderr}`);
      // There was a problem, send stderr on Telegram
      await sendTelegram(`Unable to deploy\n${err.stderr}`);
    }
  }
});
