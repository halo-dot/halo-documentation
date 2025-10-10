# Website

This website is built using <a href="https://docusaurus.io/" target="_blank">Docusaurus</a>, a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

### Creating a new version

To create a new version, use the following command:

```
$ yarn docusaurus docs:version {version-name}
```

This will create a new version that is a copy of the content in the docs directory and place it in the `/versioned_docs/version-{version-name}` and the sidebar to `/versioned_sidebars/verions-{version-name}-sidebars.json`. It can be edited and maintained.

Add the new version to the `docusaurus.config` file under the `versions`.

Additionally, you can edit previous version of the docs simply by editing the version in the versioned_docs/version-{version-name} directory.
