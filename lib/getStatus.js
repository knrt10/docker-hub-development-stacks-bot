const { matchTerms } = require('./matchTerms');

module.exports = {
  async getStatus(context) {
    const { title } = context.payload.pull_request
    const match = matchTerms([
      'wip',
      'WIP'
    ], title)

    if (!match) {
      return {
        wip: false
      }
    }

    return {
      wip: true,
      location: 'title',
      text: title,
      match
    }
  }
}
