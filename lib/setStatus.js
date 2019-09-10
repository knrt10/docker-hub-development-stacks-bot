const { appConfig } = require('./appConfig');

module.exports = {
  async setStatus(newStatus, context) {
    const pullRequest = context.payload.pull_request
    const { name } = appConfig()

    const checkOptions = {
      name: name,
      head_branch: '',
      head_sha: pullRequest.head.sha,
      status: 'in_progress',
      started_at: new Date(newStatus.timeStart).toISOString(),
      output: {
        title: `Title contains ${`"${newStatus.match}"`}`,
        summary: `The title "${pullRequest.title}" contains "${newStatus.match}".`,
        text: `By default, WIP only checks the pull request title for the terms "WIP", "wip".`
      },
      request: {
        retries: 3,
        retryAfter: 3
      }
    }

    if (!newStatus.wip) {
      checkOptions.status = 'completed'
      checkOptions.conclusion = 'success'
      checkOptions.completed_at = new Date().toISOString()
      checkOptions.output.title = 'Ready for review'
      checkOptions.output.summary = 'No match found based on configuration'
    }

    return context.github.checks.create(context.repo(checkOptions))
  }
}
