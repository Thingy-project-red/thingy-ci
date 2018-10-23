require('dotenv').config();
const http = require('http');
const webhook = require('github-webhook-handler')({
  path: '/', secret: process.env.CI_SECRET
});
const exec = require('await-exec');

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
    } catch (err) {
      console.error(`Unable to deploy\n${err.stderr}`);
    }
  }
});
