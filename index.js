const core = require('@actions/core');
const io = require('@actions/io');
const inputs = require('./src/inputs');
const configserver = require('./src/configserver');
const envFile = require('./src/environment-file');
const outputs = require('./src/outputs');


/**
 * Remove configserver files from runner
 */
const cleanup = async (configDirectory, performCleanup = true) => {
   if (!configDirectory) {
      throw new Error('Could not find a config directory to delete');
   }

   if (!performCleanup) {
      core.warning('Downloaded configuration from configserver has not been cleaned from runner');
      return;
   }

   await io.rmRF(configDirectory);
   core.info(`Configuration cleaned from runner`);
}



// Most @actions toolkit packages have async methods
// 'core.debug' displays only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
async function run() {
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
      await cleanup(configDirectory, settings.cleanup);

   } catch (error) {
      core.setFailed(error.message);
   }
}

run();
