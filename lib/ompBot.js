const getCommands = require('./getCommands')
const getConfig = require('probot-config')
const { getStatus } = require('./getStatus');
const { createOwnerList } = require('./functions');
const { setStatus } = require('./setStatus');
const flagUsername = ['username', 'usernam1', 'usernam']

module.exports = {
  // Setting bot usage as per commands
  async set(context, command) {
    const { arguments } = command
    const { owner, repo, number } = context.issue()
    const config = await getConfig(context, 'config.yml')
    const { owners, commandNotFound, mergeMessage } = config
    const { payload: { issue: { title } } } = context
    switch (arguments) {
      case 'help':
        const allCommands = context.issue({ body: getCommands() })
        return context.github.issues.createComment(allCommands)
      case 'wip-add':
        const notWIP = title.toLowerCase().search('wip') === -1
        if (notWIP) {
          const newTitle = `[WIP] ${title}`
          return await context.github.pullRequests.update(context.issue({
            title: newTitle,
          }))
        } 
        const params = context.issue({ body: `Already in WIP state` })
        return context.github.issues.createComment(params)
      case 'wip-rm':
        const WIP = title.toLowerCase().search('wip') !== -1
        if (WIP) {
          const newTitle = title.toLowerCase().replace('[wip]', '').trim()
          return await context.github.pullRequests.update(context.issue({
            title: newTitle,
          }))
        }
        const comment = context.issue({ body: `Not in WIP state` })
        return context.github.issues.createComment(comment)
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

  // When status of PR gets updated this works
  async statusComment(context) {
    const config = await getConfig(context, 'config.yml')
    const { data } = await context.github.pullRequests.list(context.repo())
    const { errorMessage, buildPassMessage, autoMerge, mergeMessage } = config
    const { state, sha } = context.payload
    const PR = data.filter(data => data.state === 'open' && data.statuses_url.search(`${sha}`) !== -1)
    if (context.payload.context === 'continuous-integration/jenkins/pr-merge') {
      if (state === 'success') {
        // Now check autoMerge is enabled or not for repository
        const WIPTitle = PR[0].title.search('WIP')
        if (autoMerge && WIPTitle === -1) {
          const { data: { head: { ref } } } = await context.github.pullRequests.get(context.repo({ number: PR[0].number }))
          try {
            await context.github.pullRequests.merge(context.issue({
              commit_title: 'Merging this to master',
              commit_message: 'Merged by Bot',
              number: PR[0].number,
            }))
            await context.github.gitdata.deleteRef(context.repo({ ref: `heads/${ref}` }))
            const params = context.repo({ body: mergeMessage, number: PR[0].number })
            return context.github.issues.createComment(params)
          } catch (e) {
            const { message, documentation_url } = JSON.parse(e.message)
            const errMessage = `${message} For more infomration check [Github Docs](${documentation_url})`
            const params = context.repo({ body: errMessage, number: PR[0].number })
            return context.github.issues.createComment(params)
          }
        } else if (autoMerge && WIPTitle !== -1) {
          const params = context.issue({ body: `Cannot merge this PR as this is WIP. Please remove WIP for title. Thanks`, number: PR[0].number })
          return context.github.issues.createComment(params)
        } else {
          // This means autoMerge is not enabled, so just comment
          const params = context.issue({ body: buildPassMessage, number: PR[0].number })
          return context.github.issues.createComment(params)
        }
      } else if (state === 'error') {
        const params = context.issue({ body: errorMessage, number: PR[0].number })
        return context.github.issues.createComment(params)
      }
    }
  },

  // This is for WIP state in PR
  async handlePullRequestChange(context) {
    const timeStart = Date.now()
    const newStatus = await getStatus(context)
    await setStatus({ timeStart, ...newStatus }, context)
  }
} 
