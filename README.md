# 1Password for VS Code (`opvs`)

> Connect VS Code to 1Password

📦 Get it on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=1Password.opvs).

## Development

This is an extension for Visual Studio Code, please refer to the [Extension API](https://code.visualstudio.com/api) documentation.

Requires [Node](https://nodejs.org/en/), [VS Code](https://code.visualstudio.com/), and [vsce](https://github.com/microsoft/vscode-vsce) installed globally.

### Dependencies

To install dependencies:

```shell
yarn # or yarn install
```

#### Updating dependencies

From time to time we should update our Yarn dependencies. Our repo does not have an automated way to do this, but you can use the commands below to manually upgrade them:

```shell
# update everything to the latest version
yarn update --latest

# choose which deps to update
yarn update-interactive --latest
```

If you are in the process of rebasing or merging branches and you run into a conflict in `yarn.lock`, first resolve any conflicts in `package.json` and then run `yarn`, which will detect the conflict and autokatically resolve it.

### Running locally

While you're working on the extension you should watch for changes:

```shell
yarn watch
```

This will recompile the extension into the `/dist` folder whenever a file changes.

To preview the extension while you're working on it, hit `F5` to trigger the "Run Extension" debugger (or go to the "Run and Debug" panel and hit the play button next to the "Run Extension (opvs)" item). With the extension running in a new window, your development window will have a debugger toolbar to stop and reload the extension as needed.

### Linting and formatting

Code should be linted and formatted where appropriate. We have commands for all types of code in this project:

```shell
# Run Prettier on all TS files
yarn prettier

# Run ESLint on all TS files
yarn eslint

# Typecheck all TS files
yarn typecheck
```

The above commands will only return linting reports. You can optionally attach the appropriate `--fix` / `--write` flag when running the commands, which will modify the files to fix issues that can be done so automatically. Some issues will need to be manually addressed.

#### Pre-commit checks

This project is set up to use [Husky](https://typicode.github.io/husky/), which allows us to hook into Git operations, and [lint-staged](https://www.npmjs.com/package/lint-staged), a way to run commands against globs of files staged in Git.

When you run `git commit` Husky invokes its pre-commit hook, which runs lint-staged, resulting in all the above linter commands getting called with flags set to automatically fix issues. If the linters have issues that can't be automatically addressed the commit will be aborted, giving you a chance to manually fix things. The purpose of this is to enforce code consistency across the project.

There may come a time when you need to skip these checks; to prevent the pre-commit hook from running add `--no-verify` to your commit command.

### Testing

Code should be reasonably tested. We do not currently have any required coverage threshold, but if you are adding new or changing existing functionality you should consider writing/updating tests.

This project uses [Jest](https://jestjs.io/). Commands are pretty straightforward:

```shell
# Run the entire test suite
yarn test

# Run the test suite, re-running on changes
yarn test --watch

# Run only tests that have a specific description
yarn test -t="returns the custom fields"
```

## Distribution

### Building & Packaging

When you want to build and package up the extension for manual distribution, run the following:

```shell
vsce package
```

This will run `yarn build` to create a minified version of the extension, and then package it up into a file called `opvs-[version].vsix`. This is just a ZIP file with a fancy extension, but with it anyone can install the extension manually by going to the Extension panel, opening the context menu, and clicking "Install from VSIX...".

### Publishing

To publish a new version of the extension, first make sure you are logged into the publisher account used for publishing new releases via `vsce login 1Password`.

Bump up the version in `package.json`, then run:

```shell
vsce publish
```

This will create a new version of the extension on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=1Password.opvs).

## Acknowledgments

Special thanks to Liam Barry, Elazar Cohen, Eric Amodio, Taras Novak, and others from the [VS Code Dev Slack](https://aka.ms/vscode-dev-community) who helped provided guidance and suggestions during development.
