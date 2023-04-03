const core = require('@actions/core');
const io = require('@actions/io');

/**
 * Remove configserver files from runner
 */
exports.cleanup = async function(configDirectory, performCleanup = true) {
    if(!configDirectory || configDirectory.replace(/\s/g,"") === "") {
       throw new TypeError('Could not find a config directory to delete');
    }
 
    if (!performCleanup) {
       core.warning('Downloaded configuration from configserver has not been cleaned from runner');
       return;
    }
 
    await io.rmRF(configDirectory);
    core.info(`Configuration cleaned from runner`);
 }