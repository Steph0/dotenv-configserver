
const core = require('@actions/core');
const github = require('@actions/github');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');
const {v4: uuidv4} = require('uuid');
const path = require('path');
const fs = require('fs');
/**
 * Fetches files from remote configserver
 */
exports.cloneDotenvConfig = async function(owner, repo, branch, token, destination) {
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