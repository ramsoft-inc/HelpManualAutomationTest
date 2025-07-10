# Enhanced Run Script GitHub Action

This GitHub Action automatically runs the enhanced run script when a Pull Request is merged to the main branch.

## Overview

The enhanced run script is an automated browser testing tool that:
- Uses Playwright for browser automation
- Integrates with AI services (Gemini and OpenAI) for intelligent instruction generation
- Takes screenshots of web applications
- Supports multiple modes: `default`, `ui_change`, and `new_feature`

## Setup

### 1. Required Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add the following repository secrets:

```
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. API Keys Setup

#### Gemini API Key
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy the key and add it as `GEMINI_API_KEY` secret

#### OpenAI API Key
- Visit [OpenAI Platform](https://platform.openai.com/api-keys)
- Create a new API key
- Copy the key and add it as `OPENAI_API_KEY` secret

## How It Works

### Trigger
The action is triggered when:
- A Pull Request is closed
- The PR was merged (not just closed)
- The target branch is `main` or `master`

### Execution
1. **Setup**: Installs Node.js, Python, and all dependencies
2. **Matrix Strategy**: Runs the script in three different modes:
   - `default`: Standard translation mode
   - `ui_change`: For UI changes that require screenshot updates
   - `new_feature`: For new features that need screenshots
3. **Execution**: Runs the enhanced script with the specified mode
4. **Artifacts**: Uploads screenshots and logs as artifacts

### Modes

#### Default Mode
- Standard translation mode
- Takes screenshots for both English and Spanish documentation
- Navigates through the application normally

#### UI Change Mode
- Specifically for when UI elements have changed
- Replaces existing screenshots due to UI updates
- Focuses on updated interface elements

#### New Feature Mode
- For capturing screenshots of new features
- Takes screenshots for new functionality
- Creates placeholder documentation

## Artifacts

The action creates the following artifacts:

### Screenshots
- **Name**: `enhanced-run-screenshots-{mode}`
- **Path**: `AutoSnap/screenshots/`
- **Retention**: 30 days

### Logs
- **Name**: `enhanced-run-logs-{mode}`
- **Path**: `AutoSnap/*.log` and `AutoSnap/tracewrightt/*.log`
- **Retention**: 30 days

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure both `GEMINI_API_KEY` and `OPENAI_API_KEY` are set correctly
   - Check that the API keys have sufficient credits/quota

2. **Browser Issues**
   - The action uses Playwright with Chromium
   - If browser automation fails, check the logs for specific errors

3. **Timeout Issues**
   - The script has a 30-minute timeout
   - If it times out, check if the target website is accessible

4. **Dependency Issues**
   - Ensure all Node.js and Python dependencies are properly installed
   - Check the build logs for any missing packages

### Debugging

1. **Check Action Logs**
   - Go to Actions tab in your repository
   - Click on the failed workflow run
   - Review the step-by-step logs

2. **Download Artifacts**
   - Even if the script fails, artifacts are uploaded
   - Download logs and screenshots for analysis

3. **Local Testing**
   - Test the script locally before pushing changes
   - Ensure it works with your current API keys

## Customization

### Modify Modes
To add or remove modes, edit the matrix strategy in `.github/workflows/enhanced-run-on-pr-merge.yml`:

```yaml
strategy:
  matrix:
    mode: [default, ui_change, new_feature, your_custom_mode]
```

### Change Timeout
Modify the timeout in the "Run enhanced script" step:

```yaml
timeout-minutes: 30  # Change this value
```

### Add Notifications
You can add Slack, Discord, or email notifications by adding additional steps to the workflow.

## Security Notes

- API keys are stored as GitHub secrets and are encrypted
- Never commit API keys directly to the repository
- Regularly rotate your API keys for security
- Monitor API usage to avoid unexpected charges

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the action logs for specific error messages
3. Ensure all dependencies and API keys are properly configured
4. Test the script locally to isolate issues 