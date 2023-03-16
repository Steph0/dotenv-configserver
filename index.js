const core = require('@actions/core');
const io = require('@actions/io');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const inputs = require('./src/inputs');
const fetchConfigserver = require('./src/fetch-configserver');

/**
 * Sets env variable for the job
 */
const exportToGithubEnv = (envData = {}) => {
   core.info(`Exporting to GITHUB_ENV`);
   for (const [envKey, envValue] of Object.entries(envData)) {
      core.info(`Exporting to GITHUB_ENV [${envKey}: ${envValue}]`);
      core.exportVariable(envKey, envValue);
   }
}

/**
 * Sets output variable that can be used between jobs
 */
const exportToOutput = (envData = {}) => {
   core.info(`Exporting to output`);
   for (const [envKey, envValue] of Object.entries(envData)) {
      core.info(`Exporting [${envKey}: ${envValue}]`);
      core.setOutput(envKey, envValue);
   }
}

/**
 * Determines target configuration filename based on action settings
 */
const buildEnvFilename = (root, directory, filename, profile = '') => {

   const hasExtension = (filename.lastIndexOf('.') !== -1);
   const namePart = (hasExtension) ? filename.substring(0, filename.lastIndexOf('.')) : filename;
   const extensionPart = (hasExtension) ? filename.substring(filename.lastIndexOf('.'), filename.length) : '';
   core.debug(`${filename} -> name:[${namePart}], extension: [${extensionPart}]`);

   // If no profile, just use current filename
   let profiledFilename = filename;
   if (profile) {
      if (namePart === '' && extensionPart !== '') {
         // Input from user has no filename (like just an extension '.env' file)
         // Inject profile without the '-' part
         // Ex: profile=prod + filename=.env => 'prod.env'
         profiledFilename = `${profile}${extensionPart}`;
      } else if (namePart !== '' && extensionPart === '') {
         // Input from user has no extension, add '.env' to it automatically
         // Ex: profile=prod + filename=application => 'application-prod.env'
         profiledFilename = `${namePart}-${profile}.env`;
      } else if (namePart !== '' && extensionPart !== '') {
         // Input has name + extension, inject profile between name and extension
         // Ex: profile=prod + filename=application.env => 'application-prod.env'
         profiledFilename = `${namePart}-${profile}${extensionPart}`;
      }
   }

   return path.join(root, directory, profiledFilename);
}

/**
 * Parse env file
 */
const loadDotenvFile = (filepath) => {
   core.info(`Loading [${filepath}] file`);
   return dotenv.parse(
      fs.readFileSync(filepath)
   );
};



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
      const configDirectory = await fetchConfigserver.execute(settings.owner, settings.repo, settings.branch,
         settings.token, settings.destination);

      // Define file to look for in configserver
      const configurationFile = buildEnvFilename(configDirectory, settings.directory,
         settings.filename, settings.profile)
      core.info(`Expected configuration filename: [${configurationFile}]`);

      // Load targeted configserver file content
      const envData = loadDotenvFile(configurationFile);
      core.debug(envData);

      // Publish file to GITHUB_ENV
      exportToGithubEnv(envData);
      core.info(`Configuration successfully loaded from configserver to GITHUB_ENV`);

      // Publish file to output
      exportToOutput(envData);
      core.info(`Configuration successfully loaded from configserver to output`);

      // Clean download env files
      await cleanup(configDirectory, settings.cleanup);

   } catch (error) {
      core.setFailed(error.message);
   }
}

run();
