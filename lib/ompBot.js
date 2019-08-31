const getCommands = require('./getCommands')
const getConfig = require('probot-config')
const flagUsername = ['username', 'usernam1', 'usernam']

module.exports = {
  async set(context, command) {
    const { arguments } = command
    const { owner, repo, number } = context.issue()
    const config = await getConfig(context, 'config.yml')
    const { owners, commandNotFound, mergeMessage } = config
    switch (arguments) {
      case 'help':
        const allCommands = context.issue({ body: getCommands()})
        return context.github.issues.createComment(allCommands)
      case 'reviewList':
        if (owners) {
          return context.github.issues.createComment(context.issue({
            body: `You can ask for review from users given below
            \n${createOwnerList(owners)}`
          }))
        } 

        return context.github.issues.createComment(context.issue({
          body: `Only one repository owner found. 
        Please ask **${owner}** for review`
        }))       
      case 'merge':
        const { data: { merged, mergeable, state, head: { ref, sha } } } = await context.github.pullRequests.get(context.issue())
        // Check for PR status

        let { data } = await context.github.repos.listStatusesForRef(context.repo({
          ref: sha
        }))

        data = data.filter(val => val.context === 'continuous-integration/jenkins/pr-merge' && val.state === 'success')
        
        if (!merged && mergeable && state === 'open') {
          if (data.length < 1) {
            const params = context.issue({ body: `Please wait for tests to run` })
            return context.github.issues.createComment(params)
          }
          try {
            await context.github.pullRequests.merge(context.issue({
              commit_title: 'Merging this to master',
              commit_message: 'Merged by Bot',
            }))

            await context.github.gitdata.deleteRef(context.repo({ ref: `heads/${ref}` }))
            const params = context.issue({ body: mergeMessage })
            return context.github.issues.createComment(params)
          } catch (e) {
            const { message, documentation_url } = JSON.parse(e.message)
            const errMessage = `${message} For more infomration check [Github Docs](${documentation_url})`
            const params = context.issue({ body: errMessage })
            return context.github.issues.createComment(params)
          }
        }
        return context.github.issues.createComment(context.issue({
          body: 'Sorry, cannot merge this PR.'
        }))
      default:
        // Check for review username
        if (arguments.match(/createReviewRequest/g)) {
          const checkRequestReview = arguments.slice(0, 19)
          if (checkRequestReview === 'createReviewRequest') {
            const usernames = arguments.split(' ').slice(1)
            // Check from flaged username
            const flaggedUsername = usernames.map(element => {
              if (flagUsername.includes(element)){
                return true
              };
              return false
            })[0];
            if (flaggedUsername) {
              const params = context.issue({ body: `Sorry cannot use this username for asking review on this PR` })
              return context.github.issues.createComment(params)
            }
            try {
              return await context.github.pullRequests.createReviewRequest({
                owner,
                repo,
                number,
                reviewers: usernames,
              })
            } catch (e) {
              const { message, documentation_url } = JSON.parse(e.message)
              const errMessage = `${message} For more infomration check [Github Docs](${documentation_url})`
              const params = context.issue({ body: errMessage })
              return context.github.issues.createComment(params)
            }
          }
        }
        if (commandNotFound) {
          const params = context.issue({ body: commandNotFound })
          return context.github.issues.createComment(params)
        }
    }
  },

  async statusComment(context) {
    const config = await getConfig(context, 'config.yml')
    const { data } = await context.github.pullRequests.list(context.repo())
    const { errorMessage, buildPassMessage } = config
    const { state, sha } = context.payload
    const PRNumber = data.filter(data => data.state === 'open' && data.statuses_url.search(`${sha}`) !== -1)
    if (context.payload.context === 'continuous-integration/jenkins/pr-merge') {
      if (state === 'success') {
        const params = context.issue({ body: buildPassMessage, number: PRNumber[0].number })
        return context.github.issues.createComment(params)
      } else if (state === 'failed') {
        const params = context.issue({ body: errorMessage, number: PRNumber[0].number })
        return context.github.issues.createComment(params)
      }
    }
  }
}

function createOwnerList(owners) {
  let list = ''
  for (i = 0; i < owners.length; i++) {
    list += `- **${owners[i]}**\n`
  }
  return list
}
