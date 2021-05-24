const core = require('@actions/core');
const github = require('@actions/github');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const {v4: uuidv4} = require('uuid');

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
 * Fetches files from remote configserver
 */
const cloneDotenvConfig = async (owner, repo, branch, token, destination) => {
   // Making sure target path is accessible
   await io.mkdirP(destination);

   // Login with token
   const octokit = github.getOctokit(token);
   // Detect platform
   const onWindows = (process.platform === 'win32');
   const downloadRepo = (onWindows) ? octokit.rest.repos.downloadZipballArchive : octokit.rest.repos.downloadTarballArchive;
   const archiveExt = (onWindows) ? '.zip' : '.tar.gz';
   const extract = (onWindows) ? tc.extractZip : tc.extractTar;

   const params = {
      owner: owner,
      repo: repo,
      ref: branch
   };
   core.info("Downloading zip archive");
   core.debug(params);
   const response = await downloadRepo(params);
   if (response.status != 200) {
      throw new Error(`Enable to fetch repository. HTTP:[${response.status}], content:[${response.data}]`);
   }

   const downloadUuid = uuidv4();
   const archiveFilepath = path.join(destination, `archive-${repo}-${downloadUuid}${archiveExt}`);
   core.info(`Writing archive file [${archiveFilepath}] to disk`);
   const archiveData = Buffer.from(response.data);
   await fs.promises.writeFile(archiveFilepath, archiveData);

   // Extract archive
   const repoPath = path.join(destination, `${repo}-${downloadUuid}`);
   core.info(`Extracting archive to [${repoPath}]`);
   await extract(archiveFilepath, repoPath);

   // Cleanup archive
   await io.rmRF(archiveFilepath);

   // Env content is in archives single folder
   const archiveContent = await fs.promises.readdir(repoPath);
   const dotenvConfigPath = path.resolve(
      path.join(repoPath, archiveContent[0])
   );
   core.info(`Configuration available at [${dotenvConfigPath}]`);

   return dotenvConfigPath;
};

/**
 * Remove configserver files from runner
 */
const cleanup = async (configDirectory, cleanup = true) => {
   if (!configDirectory) {
      throw new Error('Could not find a config directory to delete');
   }

   if (!cleanup) {
      core.warning('Downloaded configuration from configserver has not been cleaned from runner');
      return;
   }

   await io.rmRF(configDirectory);
   core.info(`Configuration cleaned from runner`);
}

const inputs = () => {
   return {
      // The repository to fetch (<owner>/<repo>)
      repository: core.getInput('repository', { required: true }),
      owner: core.getInput('repository', { required: true }).split('/')[0],
      repo: core.getInput('repository', { required: true }).split('/')[1],

      // This should be a token with access to your repository scoped in as a secret
      // token: ${{ secrets.GITHUB_TOKEN }}
      token: core.getInput('token', { required: true }),

      // The remote branch to checkout (default: main)
      branch: core.getInput('branch') || "main",

      // The working folder to write configuration to (default 'RUNNER_TEMP')
      destination: core.getInput('destination') || process.env['RUNNER_TEMP'] || '.',

      // Look for file in subdirectory (default '.')
      directory: core.getInput('directory') || '.',

      // The config filename (default to '.env')
      filename: core.getInput('filename') || ".env",

      // profile for file (ex: 'prod' will make tool look for <filename_part>-<profile>.<filename_extension>)
      // extension represents the last dot of a filename (if any)
      // if empty, won't apply
      profile: core.getInput('profile') || '',

      // If false, won't delete configuration files downloaded after loading to GITHUB_ENV
      cleanup: core.getInput('cleanup') || true
   };
}

// Most @actions toolkit packages have async methods
// 'core.debug' displays only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true
async function run() {
   try {
      // Load inputs
      const settings = inputs();
      core.debug(settings);

      // Clone remote configserver
      const configDirectory = await cloneDotenvConfig(settings.owner, settings.repo, settings.branch,
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
