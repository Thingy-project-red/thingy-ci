require('dotenv').config();
const http = require('http');
const webhook = require('github-webhook-handler')({
  path: '/', secret: process.env.CI_SECRET
});
const git = require('simple-git/promise')(process.env.CI_DIR);
const compose = require('docker-compose');

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
  const hookBranch = event.payload.ref.split('/')[2];
  console.log(`Received a push event for branch ${hookBranch}`);
  if (hookBranch === process.env.CI_BRANCH) {
    console.log(`Doing git pull on branch ${process.env.CI_BRANCH}`);
    await git.pull('origin', process.env.CI_BRANCH);
    console.log('Running docker-compose up --build');
    await compose.buildAll({ cwd: process.env.CI_DIR });
    await compose.upAll({ cwd: process.env.CI_DIR });
  }
});
