# Environment from dotenv config server

Load dotenv (.env) files from a remote repository and loads it to `GITHUB_ENV`.
Env variables will be then available using `${{ env.<KEY> }}` in your later jobs/actions.

**This action can work as a workaround from missing Github Environments tab in Github Teams plan**

## Configuration

|  Parameter  | Required | Description                                                                                                                            | Example                                                                                                 |
|:-----------:|:--------:|----------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
|  repository |   true   | The repository ref <owner>/<repo>                                                                                                      | `repository: "Steph0/dotenv-configserver"`                                                              |
|    token    |   true   | This should be a token with access to your repository scoped in as a secret                                                            | `token: ${{ secrets.GITHUB_TOKEN }}`                                                                    |
|    branch   |   false  | The remote branch to checkout (default: main)                                                                                          | `branch: "staging"`                                                                                     |
| destination |   false  | The working folder to write configuration to (default 'RUNNER_TEMP')                                                                   | `destination: "/my/dest/folder"`                                                                        |
|  directory  |   false  | Look for file in configserver subdirectory (default '.').<br>Useful if your configserver hosts several config directories in it        | `directory: "my-app-dir"`                                                                               |
|   filename  |   false  | The config filename (default to '.env')                                                                                                | `filename: "my-application.env"`                                                                        |
|   profile   |   false  | Profile for file (ex: 'prod' will make tool <br>look for <filename_part>-<profile>.<filename_extension>)<br><br>If empty, won't apply. | `profile: "prod"`<br>Depending on filename will make action look for file:<br>`my-application-prod.env` |
|   cleanup   |   false  | If false, won't delete configuration files downloaded after loading to GITHUB_ENV (default: true)                                      | `cleanup: false`                                                                                        |

## Usage

This action allows many directory structure in your configserver.
This section illustrates dotenv-configserver configurations according to common examples of configserver directory structures:

### Basic

Configserver:
<pre>
(main branch)
|_ .env
</pre>

Github Action:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      -   name: "Checkout"
          id: checkout
          uses: actions/checkout@v2

      - name: "Launch action"
        uses: Steph0/dotenv-configserver
        with:
          repository: "Steph0/test-configserver"
          token: "${{ secrets.ACTION_TOKEN }}"
      
      # You should see your .env config in 'env'
      - name: "See exported values"
        run: env
```

### Flat

Configserver:

<pre>
(main branch)
|_ dev.env
|_ staging.env
|_ prod.env
</pre>

Github Action:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      -   name: "Checkout"
          id: checkout
          uses: actions/checkout@v2

      - name: "Launch action"
        uses: Steph0/dotenv-configserver
        with:
          repository: "Steph0/test-configserver"
          token: "${{ secrets.ACTION_TOKEN }}"
          # Will look for 'prod.env'
          profile: "prod"
      
      # You should see your .env config in 'env'
      - name: "See exported values"
        run: env
```

### Env per branch

Configserver:
<pre>
(main branch)
|_ .env

(dev branch)
|_ .env
</pre>

Github Action:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      -   name: "Checkout"
          id: checkout
          uses: actions/checkout@v2

      - name: "Launch action"
        uses: Steph0/dotenv-configserver
        with:
          repository: "Steph0/test-configserver"
          token: "${{ secrets.ACTION_TOKEN }}"
          # Will checkout 'dev' branch
          branch: "dev"
      
      # You should see your .env config in 'env'
      - name: "See exported values"
        run: env
```


### Nested directories

Configserver:
<pre>
(main branch)
|_ front
   |_ application-prod.env
|_ backend
   |_ application-prod.env

(dev branch)
|_ front
   |_ application-dev.env
|_ backend
   |_ application-dev.env
</pre>

Github Action:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      -   name: "Checkout"
          id: checkout
          uses: actions/checkout@v2

      - name: "Launch action"
        uses: Steph0/dotenv-configserver
        with:
          repository: "Steph0/test-configserver"
          token: "${{ secrets.ACTION_TOKEN }}"
          # Will checkout 'dev' branch
          branch: "dev"
          # Look for backend conf
          directory: backend
          # Override default filename
          filename: "application" # or `application.env`
          # Insert profile in filename (eg: application-dev.env)
          profile: "dev"
      
      # You should see your .env config in 'env'
      - name: "See exported values"
        run: env
```

## Development

Install

```bash
# Install dependencies
npm install
# Build action
npm run all
```

You can test actions locally using [ACT](https://github.com/nektos/act).
Example:

```bash
# 'test.secrets' is a local file (automatically ignored) containing secrets like your Github PAT
npm run prepare && \
act workflow_dispatch -e ./.github/workflows/act-test.event -b --secret-file ./.github/workflows/test.secrets
```

## Inspiration

This project took great inspiration from:

* [xom9ikk/dotenv](https://github.com/xom9ikk/dotenv)
* [actions/checkout](https://github.com/actions/checkout)

Heavily based also on the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages).

## Package for distribution

GitHub Actions will run the entry point from the action.yml. Packaging assembles the code into one file that can be checked in to Git, enabling fast and reliable execution and preventing the need to check in node_modules.

Actions are run from GitHub repos.  Packaging the action will create a packaged action in the dist folder.

Run prepare

```bash
npm run prepare
```

Since the packaged index.js is run from the dist folder.

```bash
git add dist
```

## Create a release branch

Users shouldn't consume the action from master since that would be latest code and actions can break compatibility between major versions.

Checkin to the v1 release branch

```bash
git checkout -b v1
git commit -a -m "v1 release"
```

```bash
git push origin v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Usage

You can now consume the action by referencing the v1 branch

```yaml
uses: actions/javascript-action@v1
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/actions/javascript-action/actions) for runs of this action! :rocket:
