const commands = require('probot-commands')
const ompBot = require('./lib/ompBot')
/**
 * This is main entrypoint of APP
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.log('Yay, the app was loaded!')
  commands(app, 'ompBot', ompBot.set)

  app.on('status', ompBot.statusComment)
  app.on([
    'pull_request.opened',
    'pull_request.edited',
    'pull_request.synchronize',
    'pull_request.labeled',
    'pull_request.unlabeled',
  ], ompBot.handlePullRequestChange)
}
