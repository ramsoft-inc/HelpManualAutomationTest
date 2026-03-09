# AutoSnap

## What is AutoSnap?
AutoSnap automates screenshot capture for your documentation. Instead of manually taking screenshots, AutoSnap navigates your web application and tries to capture the images for you.

Think of it as an assistant that:
- Opens your application in a browser
- Clicks through the UI following your documentation steps
- Takes screenshots at the right moments
- Saves them with the correct filenames

For comprehensive documentation, visit the [AutoSnap Wiki Page](https://ramsoftinc.atlassian.net/wiki/spaces/OA/pages/1465548811/AutoSnap).

## Where Can You Use AutoSnap?

AutoSnap can be used in two ways:

1. **Locally in Your Terminal**  
   Run AutoSnap commands directly from your local development environment.

2. **GitHub PR Comments**  
   Trigger AutoSnap directly from a Pull Request comment. Perfect for translation workflows and automated screenshot updates.

## Prerequisites

- Node.js (v18 or higher)
- Python 3.8 or higher
- npm
- pip

## Setup Instructions

Run the setup script in this directory:

```powershell
# From the AutoSnap directory
powershell -ExecutionPolicy Bypass -File setup.ps1
```

After setup is complete:
1. Edit the `.env` file and add your API keys (AZURE_OPENAI_API_KEY, GEMINI_API_KEY, and AZURE_OPENAI_ENDPOINT).

## Three Ways to Use AutoSnap

AutoSnap has three modes, each designed for a specific documentation task:

| Mode | When to Use |
|------|------------|
| Translation Mode | Creating screenshots for translated documentation |
| UI Update Mode | Replacing outdated screenshots after UI changes |
| New Feature Mode | Capturing screenshots for newly documented features |

### Mode 1: Translation Mode (Folder Mode)

**When to Use This**  
You have documentation translated into another language and need screenshots that match the translated UI.

**What You Need**
- A folder containing translated .md or .mdx files (e.g., docs-es, docs-fr)
- Your web application must support switching to that language

**How It Works**  
Local Command:
```
node test-enhanced-flow.js --folder ./docs-es --lang es
```

GitHub PR Comment:
```
autosnap --folder ./docs-es --lang es
```

### Mode 2: UI Update Mode (File Mode)

**When to Use This**  
Your product's UI has changed, and the screenshots in your documentation are now outdated.

**What You Need**
- A specific documentation file that contains outdated screenshots
- The file must already have image references (existing screenshots)

**How It Works**  
Local Command:
```
node test-enhanced-flow.js --file ./docs/user-guide/dashboard.md --mode ui_change
```

GitHub PR Comment:
```
autosnap --file ./docs/user-guide/dashboard.md --mode ui_change
```

### Mode 3: New Feature Mode (File Mode)

**When to Use This**  
You're documenting a new feature and need AutoSnap to generate screenshots from placeholders.

**What You Need**
- A documentation file with placeholder comments for where screenshots should go
- Placeholders must follow the correct format

**Placeholder Format**  
Use this exact format in your markdown files:
```
<!-- placeholder for screenshot: name-of-the-image.png -->
```
Or without a name:
```
<!-- placeholder for screenshot -->
```

**How It Works**  
Local Command:
```
node test-enhanced-flow.js --file ./docs/new-export-feature.md --mode new_feature
```

GitHub PR Comment:
```
autosnap --file ./docs/new-export-feature.md --mode new_feature
```

## Command Options

| Option | Description | Required? |
|--------|-------------|-----------|
| --folder \<path\> | Process entire folder (Translation mode) | For Translation mode |
| --file \<path\> | Process single file (UI Update or New Feature) | For UI/Feature modes |
| --mode \<type\> | Processing mode: ui_change, new_feature, or translation | For file mode |
| --lang \<code\> | Language code (e.g., es, fr, pt) | For translation mode |
| --help | Show help message | No |

## Quick Setup Guide

**Before You Start**
1. Run the setup script:
   - Windows: Double-click setup.bat
   - Mac/Linux: Run ./setup.sh
2. Configure API key: Add your AZURE_OPENAI_API_KEY, GEMINI_API_KEY, and AZURE_OPENAI_ENDPOINT to the .env file

## Running AutoSnap

1. Navigate to the AutoSnap directory:
   ```
   cd AutoSnap
   ```

2. Run the enhanced flow with appropriate options:
   ```
   node test-enhanced-flow.js [OPTIONS]
   ```
   Or use the npm script:
   ```
   npm run run-enhanced
   ```

3. When finished:
   ```
   cd ..  # Return to main directory
   ```

Note: The setup creates a Python virtual environment, but you don't need to manually activate it. The npm scripts will handle Python execution automatically.

## GitHub PR Comment Usage

To use AutoSnap in GitHub Pull Requests, simply comment on the PR with the `autosnap` command followed by your parameters.

**Supported Comment Formats**  
All of these formats work:
```
autosnap --mode translation --folder ./docs-es --lang es
```

**How It Works**
- Comment on your PR with an AutoSnap command
- GitHub Actions workflow detects the comment
- AutoSnap runs with your specified parameters
- Screenshots are captured and committed to your PR branch
- Results are posted back as a comment on your PR

## 🚀 Enhanced Tracewright Test Flow

### USAGE:
```
node test-enhanced-flow.js [OPTIONS]
```

### MODES:
- **Default/Translation Mode**: Processes all .md/.mdx files in specified folder (default and translation are the same)
- **Single File Mode**: Processes a single specified .md/.mdx file with classification
- **List Mode**: Processes multiple files from a list file with auto-classification for each

### OPTIONS:
```
--folder <path>            Default/Translation mode: Process folder that mirrors docs structure (NOT docs itself)
--file <path>              Single file mode: Process one specific .md/.mdx file

--mode, -m <mode>          Scenario type: ui_change, new_feature, default/translation
--lang, -l <code>          Language code or name to select in UI (overrides auto-detection)        
--help, -h                 Show this help message
```

### EXAMPLES:
```
# Default/Translation mode on Spanish docs (auto-detect Spanish)
node test-enhanced-flow.js --folder ./docs-es        

# Default/Translation mode on Portuguese docs (auto-detect Portuguese)
node test-enhanced-flow.js --folder ./i18n/pt-BR     

# Default/Translation mode on French docs (auto-detect French)
node test-enhanced-flow.js --folder ./docs-fr        

# Default/Translation mode with explicit Spanish language code
node test-enhanced-flow.js --folder ./custom --lang es  

# Default/Translation mode with explicit Spanish language name
node test-enhanced-flow.js --folder ./docs-es --lang Spanish  

# Single file mode
node test-enhanced-flow.js --file ./docs/guide.md    

# Single file with specific mode
node test-enhanced-flow.js --file ./docs/api.md --mode new_feature  

# Single file with explicit language
node test-enhanced-flow.js --file ./spanish/guide.md --lang es  

# Use custom file list
node test-enhanced-flow.js --changed-files list.txt  

# Process files from list with auto-classification
node test-enhanced-flow.js --list file-list.md       

# Process list with forced mode
node test-enhanced-flow.js --list my-files.txt --mode ui_change  

# Process list with explicit Portuguese
node test-enhanced-flow.js --list my-files.txt --lang pt  
```

### CONFIGURATION:
Image Naming: The script uses simple, descriptive names for generated images based on nearby headings or emphasized text in the markdown content. No suffixes are added.

### MODE DETAILS:

#### 🌐 Default/Translation Mode:
- Processes .md/.mdx files that contain actual images in specified folder
- Skips files without any images (no screenshots needed)
- No classification - treats all files the same way
- Default and translation modes are identical (both use the same processing)
- Works with ANY language folder that mirrors docs/ structure (e.g., docs-es, docs-fr, docs-de, i18n/pt-BR, etc.)
- Automatically detects language from folder path and sets UI language accordingly
- Navigates to worklist and selects appropriate language before processing
- Supported languages: English, Spanish, French, Hindi, Portuguese
- Language codes: en (English), es (Spanish), fr (French), hi (Hindi), pt (Portuguese)
- --lang option accepts both language names and codes (e.g., --lang Spanish or --lang es)

#### 📄 Single File Mode:
- Processes one specific .md/.mdx file
- Classifies the file and processes according to its content:
  - new_feature: File contains placeholders
  - ui_change: File contains images but no placeholders
  - none: File has neither (minimal processing)
- Can be combined with --mode to force specific processing type


## Important Notes

- Node.js packages are installed locally to the AutoSnap directory.
- The `.env` file must be configured with your API keys before running AutoSnap.
- A Python virtual environment is created during setup, but you don't need to interact with it directly.
