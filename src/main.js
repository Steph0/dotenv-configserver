const core = require('@actions/core');
const inputs = require('./inputs');
const configserver = require('./configserver');
const envFile = require('./environment-file');
const outputs = require('./outputs');
const cleanup = require('./cleanup');

// Most @actions toolkit packages have async methods
// 'core.debug' displays only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
exports.run = async function() {
   try {
      // Load inputs
      const settings = inputs.load();
      core.debug(settings);

      // Clone remote configserver
      const configDirectory = await configserver.fetch(settings.owner, settings.repo, settings.branch,
         settings.token, settings.destination);

      // Define file to look for in configserver
      const configurationFile = envFile.buildEnvFilename(configDirectory, settings.directory,
         settings.filename, settings.profile)
      core.info(`Expected configuration filename: [${configurationFile}]`);

      // Load targeted configserver file content
      const envData = envFile.loadDotenvFile(configurationFile);
      core.debug(envData);

      // Publish file to GITHUB_ENV
      outputs.exportToGithubEnv(envData);
      core.info(`Configuration successfully loaded from configserver to GITHUB_ENV`);

      // Publish file to output
      outputs.exportToOutput(envData);
      core.info(`Configuration successfully loaded from configserver to output`);

      // Clean download env files
      await cleanup.cleanup(configDirectory, settings.cleanup);

   } catch (error) {
      core.setFailed(error.message);
   }
}
