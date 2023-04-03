const core = require('@actions/core');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

/**
 * Determines target configuration filename based on action settings
 */
exports.buildEnvFilename = function(root, directory, filename, profile = '') {

    if(profile.replace(/\s/g,"") === "" && (!filename || filename.replace(/\s/g,"") === "")) {
        throw new TypeError("You must provide a filename or at least a profile");
    }

    const hasExtension = (filename.lastIndexOf('.') !== -1);
    const namePart = (hasExtension) ? filename.substring(0, filename.lastIndexOf('.')) : filename;
    const extensionPart = (hasExtension) ? filename.substring(filename.lastIndexOf('.'), filename.length) : '';
    core.debug(`${filename} -> name:[${namePart}], extension: [${extensionPart}]`);

    // If no profile, just use current filename
    let profiledFilename = `${namePart}${extensionPart}`;
    if (profile) {
        if (namePart === '' && extensionPart !== '') {
            // Input from user has no filename (like just an extension '.env' file)
            // Inject profile without the '-' part
            // Ex: profile=prod + filename=.env => 'prod.env'
            profiledFilename = `${profile}${extensionPart}`;
        } else if (namePart !== '') {
            // Input has name + extension, inject profile between name and extension
            // Ex: profile=prod + filename=application.env => 'application-prod.env'
            profiledFilename = `${namePart}-${profile}${extensionPart}`;
        } else {
            // Input has only a profile
            // Ex: profile=prod + filename= => 'prod'
            profiledFilename = `${profile}${extensionPart}`;
        }
    }

    return path.join(root, directory, profiledFilename);

}

/**
* Parse env file
*/
exports.loadDotenvFile = function(filepath) {
  core.info(`Loading [${filepath}] file`);
  return dotenv.parse(
     fs.readFileSync(filepath)
  );
};