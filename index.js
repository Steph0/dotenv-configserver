const core = require('@actions/core');


// function downloadConfiguration() {

   // Build repo url
   // core.info(
   //    `Syncing repository: ${settings.repositoryOwner}/${settings.repositoryName}`
   //  );
   //  const repositoryUrl = urlHelper.getFetchUrl(settings);

   // Define 'ref'
   // result.ref = core.getInput('ref')
   // if (!result.ref) {
   //   if (isWorkflowRepository) {
   //     result.ref = github.context.ref
   //     result.commit = github.context.sha
 
   //     // Some events have an unqualifed ref. For example when a PR is merged (pull_request closed event),
   //     // the ref is unqualifed like "main" instead of "refs/heads/main".
   //     if (result.commit && result.ref && !result.ref.startsWith('refs/')) {
   //       result.ref = `refs/heads/${result.ref}`
   //     }
   //   }
   // }
   // // SHA?
   // else if (result.ref.match(/^[0-9a-fA-F]{40}$/)) {
   //   result.commit = result.ref
   //   result.ref = ''
   // }
   // core.debug(`ref = '${result.ref}'`)
   // core.debug(`commit = '${result.commit}'`)


   // Auth token
//   result.authToken = core.getInput('token', {required: true})

   // Destination on runner
   //  process.env['RUNNER_TEMP']

   // Download archive

   // Extract archive
// }

const inputs = () => {
   return {
      // The repository to fetch
      ref: core.getInput('ref'),

      // The branch to checkout (default: main)
      branch: core.getInput('branch') || "main",

      // Look for file in subdirectory
      directory: core.getInput('directory') || '.',

      // The config filename (default to application.yml)
      filename: core.getInput('filename') || "application.yml",

      // profile for file (ex: 'prod' will make tool look for <filename_part>-<profile>.<filename_extension>)
      // extension represents the last dot of a filename (if any)
      // if empty, won't apply
      profile: core.getInput('profile') || '',

      // If false, won't delete configuration files downloaded after loading to GITHUB_ENV
      cleanup: core.getInput('cleanup') || true
   };
}

// most @actions toolkit packages have async methods
// 'core.debug' displays only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
async function run() {
  try {
    const ms = core.getInput('milliseconds');
    const settings = inputs();
    core.info(`Waiting ${ms} milliseconds ...`);
    core.debug(settings);
    core.setOutput('time', new Date().toTimeString());
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
