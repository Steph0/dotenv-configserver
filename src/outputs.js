const core = require('@actions/core');

/**
 * Sets env variable for the job
 */
exports.exportToGithubEnv = function (envData = {}) {
    core.info(`Exporting to GITHUB_ENV`);
    for (const [envKey, envValue] of Object.entries(envData)) {
        core.info(`Exporting to GITHUB_ENV [${envKey}: ${envValue}]`);
        core.exportVariable(envKey, envValue);
    }
}

/**
* Sets output variable that can be used between jobs
*/
exports.exportToOutput = function (envData = {}) {
    core.info(`Exporting to output`);
    for (const [envKey, envValue] of Object.entries(envData)) {
        core.info(`Exporting [${envKey}: ${envValue}]`);
        core.setOutput(envKey, envValue);
    }
}