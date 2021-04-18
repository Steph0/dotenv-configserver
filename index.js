const core = require('@actions/core');
const github = require('@actions/github');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const {v4: uuidv4} = require('uuid');

// function downloadConfiguration() {

// Build repo url
// core.info(
//    `Syncing repository: ${settings.repositoryOwner}/${settings.repositoryName}`
//  );
//  const repositoryUrl = urlHelper.getFetchUrl(settings);

// Define 'repository'
// result.repository = core.getInput('repository')
// if (!result.repository) {
//   if (isWorkflowRepository) {
//     result.repository = github.context.repository
//     result.commit = github.context.sha

//     // Some events have an unqualifed repository. For example when a PR is merged (pull_request closed event),
//     // the repository is unqualifed like "main" instead of "repositorys/heads/main".
//     if (result.commit && result.repository && !result.repository.startsWith('repositorys/')) {
//       result.repository = `repositorys/heads/${result.repository}`
//     }
//   }
// }
// // SHA?
// else if (result.repository.match(/^[0-9a-fA-F]{40}$/)) {
//   result.commit = result.repository
//   result.repository = ''
// }
// core.debug(`repository = '${result.repository}'`)
// core.debug(`commit = '${result.commit}'`)


// Auth token
//   result.authToken = core.getInput('token', {required: true})

// Destination on runner
//  process.env['RUNNER_TEMP']

// Download archive

// Extract archive
// }



const loadDotenvFile = (filepath = '.env') => {
   return dotenv.parse(
      fs.readFileSync(filepath)
   );
};

const cloneConfigTar = async (owner, repo, branch, token, destination) => {
   // Making sure target path is accessible
   await io.mkdirP(destination);

   // Login with token
   const octokit = github.getOctokit(token);

   const params = {
      owner: owner,
      repo: repo,
      ref: branch
   };
   core.info("Downloading tar archive");
   core.debug(params);
   const response = await octokit.repos.downloadTarballArchive(params);
   if (response.status != 200) {
      throw new Error(`Enable to fetch repository. HTTP:[${response.status}], content:[${response.data}]`);
   }

   const downloadUuid = uuidv4();
   console.dir(downloadUuid);
   const archiveFilepath = path.join(destination, `archive-${repo}-${downloadUuid}.tar.gz`);
   core.info(`Writing archive file [${archiveFilepath}] to disk`);
   const archiveData = Buffer.from(response.data);
   await fs.promises.writeFile(archiveFilepath, archiveData);

   // Extract archive
   const repoPath = path.join(destination, `${repo}-${downloadUuid}`);
   core.info(`Extracting archive to [${repoPath}]`);
   await tc.extractTar(archiveFilepath, repoPath);

   // Cleanup archive
   await io.rmRF(archiveFilepath);

   // Env content is in archives single folder
   const archiveContent = await fs.promises.readdir(repoPath);
   const dotenvConfigPath = path.resolve(archiveContent[0]); // The top-level folder name includes the short SHA
   core.info(`Configuration available at [${dotenvConfigPath}]`);

   return dotenvConfigPath;
};

const cloneConfigZip = async (owner, repo, branch, token, destination) => {
   // Making sure target path is accessible
   await io.mkdirP(destination);

   // Login with token
   const octokit = github.getOctokit(token);

   const params = {
      owner: owner,
      repo: repo,
      ref: branch
   };
   core.info("Downloading zip archive");
   core.debug(params);
   const response = await octokit.repos.downloadZipballArchive(params);
   if (response.status != 200) {
      throw new Error(`Enable to fetch repository. HTTP:[${response.status}], content:[${response.data}]`);
   }

   const downloadUuid = uuidv4();
   console.dir(downloadUuid);
   const archiveFilepath = path.join(destination, `archive-${repo}-${downloadUuid}.zip`);
   core.info(`Writing archive file [${archiveFilepath}] to disk`);
   const archiveData = Buffer.from(response.data);
   await fs.promises.writeFile(archiveFilepath, archiveData);

   // Extract archive
   const repoPath = path.join(destination, `${repo}-${downloadUuid}`);
   core.info(`Extracting archive to [${repoPath}]`);
   await tc.extractZip(archiveFilepath, repoPath);

   // Cleanup archive
   await io.rmRF(archiveFilepath);

   // Env content is in archives single folder
   const archiveContent = await fs.promises.readdir(repoPath);
   const dotenvConfigPath = path.resolve(archiveContent[0]); // The top-level folder name includes the short SHA
   core.info(`Configuration available at [${dotenvConfigPath}]`);

   return dotenvConfigPath;
};

const inputs = () => {
   return {
      // The repository to fetch (<owner>/<repo>)
      repository: core.getInput('repository'),
      owner: core.getInput('repository').split('/')[0],
      repo: core.getInput('repository').split('/')[1],

      // This should be a token with access to your repository scoped in as a secret
      // token: ${{ secrets.GITHUB_TOKEN }}
      token: core.getInput('token'),

      // The branch to checkout (default: main)
      branch: core.getInput('branch') || "main",

      // The working folder to write configuration to (default '.')
      destination: core.getInput('destination') || '.',

      // Look for file in subdirectory (default '.')
      directory: core.getInput('directory') || '.',

      // The config filename (default to 'main.env')
      filename: core.getInput('filename') || "main.env",

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
      const settings = inputs();
      core.debug(settings);
      core.debug(loadDotenvFile());
      if (process.platform === 'win32') {
         // Windows
         cloneConfigZip(settings.owner, settings.repo, settings.branch, settings.token, settings.destination);
      } else {
         // Unix
         cloneConfigTar(settings.owner, settings.repo, settings.branch, settings.token, settings.destination);
      }
   } catch (error) {
      core.setFailed(error.message);
   }
}

run();
