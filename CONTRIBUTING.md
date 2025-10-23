# Contributing

## Development

This is an extension for Visual Studio Code, please refer to the [Extension API](https://code.visualstudio.com/api) documentation.

Requires [Node](https://nodejs.org/en/) and [VS Code](https://code.visualstudio.com/).

### Dependencies

To install dependencies:

```shell
pnpm install
```

### Running locally

While you're working on the extension you should watch for changes:

```shell
pnpm watch
```

This will recompile the extension into the `/dist` folder whenever a file changes.

To preview the extension while you're working on it, hit `F5` to trigger the "Run Extension" debugger (or go to the "Run and Debug" panel and hit the play button next to the "Run Extension (op-vscode)" item). This will open a local [Extension Host](https://code.visualstudio.com/api/advanced-topics/extension-host) with the extension running directly from the working directory. With the extension running in a new window, your development window will have a debugger toolbar to stop and reload the extension as needed.

### Linting and formatting

Code should be linted and formatted where appropriate. We have commands for all types of code in this project:

```shell
# Run Prettier on all TS files
pnpm prettier

# Run ESLint on all TS files
pnpm eslint

# Typecheck all TS files
pnpm typecheck
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
pnpm test

# Run the test suite, re-running on changes
pnpm test --watch

# Run only tests that have a specific description
pnpm test -t="returns the custom fields"
```

## Distribution

### Publishing the extension

We have a Workflow set up to automatically create a new release of the extension on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=1Password.op-vscode) and [GitHub](https://github.com/1Password/op-vscode/releases) whenever a new version tag is pushed.

You should only need to do the following on the `main` branch:

```shell
# Replace VERSION with the version you are bumping to
pnpm version VERSION && git push
```

This will:

1. Update the `version` property in `package.json`
2. Commit this version change
3. Create a new version tag
4. Push the commit and tag to the remote

Afterward the Workflow will take over, publishing the extension's new version to the VS Code Marketplace and creating a new GitHub Release.

### Manual builds

If you need to build and package up the extension for manual distribution outside of regular publishing, first install [vsce](https://github.com/microsoft/vscode-vsce) globally, and then run the following:

```shell
vsce package
```

This will run `pnpm build` to create a minified version of the extension, and then package it up into a file called `op-vscode-[version].vsix`. This is just a ZIP file with a fancy extension, but with it anyone can install the extension manually by going to the Extension panel, opening the context menu, and clicking "Install from VSIX...".

## Acknowledgments

Special thanks to Liam Barry, Elazar Cohen, Eric Amodio, Taras Novak, and others from the [VS Code Dev Slack](https://aka.ms/vscode-dev-community) who helped provided guidance and suggestions during development.
