# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Create and Edit Documentation

You can use our [OmegaAI Document Generator & Editor](https://document-generator-ejcfbzbuesgxdqg4.canadacentral-01.azurewebsites.net) to:

- Generate new documentation effortlessly with context from Jira issues
- Edit and refine existing content with AI assistance
- Easily update the help manual repository with new changes

Check out the [repository](https://github.com/ramsoft-inc/Document-Generator) for more feature details

## Development

### Installation

For the main Docusaurus project:

```
# Install dependencies using Yarn
yarn install
```

For the AutoSnap tools:

```
# Windows
cd AutoSnap
powershell -ExecutionPolicy Bypass -File setup.ps1
```

### Running Docusaurus

To run the Docusaurus development server:

```
yarn start
```

> **Note:** The `AutoSnap` directory contains separate tools with their own setup and documentation. See the [AutoSnap README](AutoSnap/README.md) if you need those tools.

### Local Development

```
# Set your Algolia API key as an environment variable **before** running 'yarn start'.
# Use your **public search-only Algolia API key** (never use an admin key).
Linux / macOS:
export ALGOLIA_API_KEY=<YOUR ALGOLIA SEARCH-ONLY API KEY HERE>
Windows PowerShell:
$env:ALGOLIA_API_KEY = '<YOUR ALGOLIA SEARCH-ONLY API KEY HERE>'

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

```
# Stage all changes
git add .

# Commit your changes with a descriptive message
git commit -m "Your descriptive commit message"

# Push to the current branch
git push

# Push to a specific branch
git push origin <branch-name>
```
