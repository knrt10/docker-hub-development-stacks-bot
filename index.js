
/**
 * This is main entrypoint of APP
 * @param {import('probot').Application} app
 */
module.exports = app => {
  app.log('Yay, the app was loaded!')
  app.on(['pull_request.opened', 'pull_request.synchronized'], async context => {
    app.log(context.payload)


    const res = await context.github.repos.createDeployment(context.repo({
      ref: context.payload.pull_request.head.ref, // The ref to deploy. This can be a branch, tag, or SHA.
      task: 'deploy', // Specifies a task to execute (e.g., deploy or deploy:migrations).
      auto_merge: true,
      required_contexts: [], 
      payload: {
        'schema': 'rocks!'
      }, // JSON payload with extra information about the deployment. Default: ""
      environment: 'production', // Name for the target deployment environment (e.g., production, staging, qa)
      description: 'First deploy!', // Short description of the deployment
      transient_environment: false, 
      production_environment: true
    }))

    const deploymentId = res.data.id
    await context.github.repos.createDeploymentStatus(context.repo({
      deployment_id: deploymentId,
      state: 'success', // The state of the status. Can be one of error, failure, inactive, pending, or success
      log_url: 'https://example.com', 
      description: 'Bot App set a deployment status!', // A short description of the status.
      environment_url: 'https://example.com', // Sets the URL for accessing your environment.
      auto_inactive: true 
    }))
  })
}
