
const core = require('@actions/core');

exports.load = function() {

    const repositoryInput = core.getInput('repository', {required: true});

    return {
        // The repository to fetch (<owner>/<repo>)
        repository: repositoryInput,
        owner: repositoryInput.split('/')[0],
        repo: repositoryInput.split('/')[1],
    
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