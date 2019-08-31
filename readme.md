<p align="center">
  <img src="https://user-images.githubusercontent.com/24803604/64061777-c80cf400-cbfc-11e9-885b-00bc2a732cfd.png" />
</p>

> Bot to help mainitaining working of this repository

## Contents

1. [Usage](#usage)
2. [Local Setup](#local-setup)
3. [Configuring a GitHub App](#configuring-a-github-app)
4. [Manually Configuring a GitHub App](#manually-configuring-a-github-app)
5. [Debugging](#debugging)
6. [License](#license)

## Usage

After installing this app from [Github MarketPlace](https://github.com/apps/docker-hub-development-stacks-bot). Just type this in one of your PR's

`/ompBot help`

## Local Setup

```sh
# Cloning the repository
git clone git@github.com:knrt10/docker-hub-development-stacks-bot.git

# Change directory to project folder
cd docker-hub-development-stacks-bot/

# Install dependencies
npm install
```

## Configuring a GitHub App

To automatically configure your GitHub App, follow these steps:

1. Run the app locally by running `npm run dev`.
1. Next follow instructions to visit `localhost:3000` (or your custom Glitch URL).
1. You should see something like this: <img width="625" alt="homepage" src="https://user-images.githubusercontent.com/24803604/64062317-94cd6380-cc02-11e9-8884-39299a0eeced.png">
1. Go ahead and click the **Register a GitHub App** button.
1. Next, you'll get to decide on an app name that isn't already taken.
1. After registering your GitHub App, you'll be redirected to install the app on any repositories. At the same time, you can check your local `.env` and notice it will be populated with values GitHub sends us in the course of that redirect.
1. Install the app on a test repository and try triggering a webhook to activate the bot!
1. You're all set! Head down to [Debugging](#debugging) to learn more about developing your Probot App.

GitHub App Manifests--otherwise known as easy app creation--make it simple to generate all the settings necessary for a GitHub App. This process abstracts the [Configuring a GitHub App](#configuring-a-github-app) section. You can learn more about how GitHub App Manifests work and how to change your settings for one via the [GitHub Developer Docs](https://developer.github.com/apps/building-github-apps/creating-github-apps-from-a-manifest/).

## Manually Configuring a GitHub App

> If you created an App with a manifest, you can skip this section; your app is already configured! If you ever need to edit those settings, you can visit `https://github.com/settings/apps/your-app-name`

To run your app in development, you will need to configure a GitHub App to deliver webhooks to your local machine.

1. On your local machine, copy `.env.example` to `.env` in the same directory.
1. Go to [smee.io](https://smee.io) and click **Start a new channel**. Set `WEBHOOK_PROXY_URL` in `.env` to the URL that you are redirected to.
1. [Create a new GitHub App](https://github.com/settings/apps/new) with:
    - **Webhook URL**: Use your `WEBHOOK_PROXY_URL` from the previous step.
    - **Webhook Secret:** `development` (Note: For optimal security, Probot apps **require** this secret be set, even though it's optional on GitHub.).
    - **Permissions & events** is located lower down the page and will depend on what data you want your app to have access to. Note: if, for example, you only enable issue events, you will not be able to listen on pull request webhooks with your app. However, for development, we recommend enabling everything.
1. Download the private key and move it to your project's directory. As long as it's in the root of your project, Probot will find it automatically regardless of the filename.
1. Edit `.env` and set `APP_ID` to the ID of the app you just created. The App ID can be found in your app settings page here <img width="1048" alt="screen shot 2017-08-20 at 8 31 31 am" src="https://user-images.githubusercontent.com/5713670/42248717-f6bf4f10-7edb-11e8-8dd5-387181c771bc.png">

## Installing the app on a repository

You'll need to create a test repository and install your app by clicking the "Install" button on the settings page of your app, e.g. `https://github.com/apps/your-app`

**Other available scripts**
* `$ npm start` to start your app without watching files.
* `$ npm run lint` to lint your code using [standard](https://www.npmjs.com/package/standard).

## Debugging

1. Always run `$ npm install` and restart the server if `package.json` has changed.
1. To turn on verbose logging, start the server by running: `$ LOG_LEVEL=trace npm start`

## License

[ISC](LICENSE) © 2019 Kautilya Tripathi <tripathi.kautilya@gmail.com> (https://knrt10.github.io)
