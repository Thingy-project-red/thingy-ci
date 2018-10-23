# thingy-ci
Pseudo CI that receives push events by GitHub webhook, pulls changes and uses
docker-compose to rebuild and restart a service.

## Usage
1. Make sure your user is privileged to use the Docker service (added to the
`docker` user group)
1. Create `.env` (see `.env.TEMPLATE`)
2. Run app with `node .`
3. Set up webhook for your GitHub repository. Make sure to deliver events
in `application/json`, not in `application/x-www-form-urlencoded`.

Since you'll want to keep this running in the background, use `screen` or
`tmux` or create a systemd unit if you want something better.
