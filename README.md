<p align="center">
  <a href="https://sentry.io" target="_blank" align="center">
    <img src="https://sentry-brand.storage.googleapis.com/sentry-logo-black.png" width="280">
  </a>
  <br />
</p>

# Sentry Integration for Visual Studio Code

VSCode extension to browse [Sentry](https://sentry.io) issues and navigate stack
traces directly in VSCode.

## Features

- Browse Sentry projects and issues from VSCode
- Launch the debugger to navigate stack traces and see variables

## Requirements

This extension requires a Sentry account. You can
[sign up for free](https://sentry.io/signup/) and then follow the
[quickstart guide](https://docs.sentry.io/quickstart/) to set up a project and
integrate it into your software.

## Usage

Run the command _Sentry: Search Issues_ from the command palette
(`CMD + Shift + P` or `Ctrl + Shift + P`) and enter a search term. You can also
use all search filters that work on the Sentry issues page. Then, select an
issue from the list.

To start a debugging session, choose _Launch debugger on Issue_ from the actions
panel. Please note that your workspace needs to contain the project sources or
search paths have to be configured. See
[Extension Settings](#extension-settings) for more information on configuration.

## Extension Settings

This extension contributes the following settings:

- `sentry.enabled`: Enable or disable this extension
- `sentry.serverUrl`: Use a custom on-premise server
- `sentry.projects`: Select projects for searching issues

## Development

Please feel free to open issues or PRs. To build and run this configuration,
open this repository in VSCode and run the _Extension_ target. To run tests, run
the _Extension Tests_ target.
