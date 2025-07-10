# Docusaurus Translation Script

This script helps automate the process of adding new translations to a Docusaurus documentation site. It handles:
1. Adding the locale to docusaurus.config.js
2. Running write-translations
3. Copying content to the new locale
4. Translating content using OpenAI

## Prerequisites

1. Node.js installed
2. OpenAI API key configured in `translation.config.js`
3. Docusaurus project set up

## Configuration

The script uses a configuration file `translation.config.js` that should contain:
```javascript
module.exports = {
    openai: {
        apiKey: 'your-api-key',
        temperature: 0.7
    }
};
```

## Usage

Run the script with the locale code:

```bash
node scripts/AddTranslationsUsingOpenAI-Local.js pt-BR
```

To include images from the docs directory, add the --include-images flag:

```bash
node scripts/AddTranslationsUsingOpenAI-Local.js pt-BR --include-images
```

This will:
1. Add 'pt-BR' to docusaurus.config.js
2. Run write-translations
3. Copy docs and blogs to the new locale
4. Translate the content using OpenAI

## How it Works

1. **Config Update**: Adds the new locale to docusaurus.config.js
2. **Write Translations**: Runs Docusaurus write-translations command
3. **Content Copy**:
   - Copies docs to `i18n/{locale}/docusaurus-plugin-content-docs/current/`
   - Copies blogs to `i18n/{locale}/docusaurus-plugin-content-blog/`
   - For docs: copies markdown files and optionally images (with --include-images flag)
   - For blogs: copies all files including images
4. **Translation**: Uses OpenAI to translate the content

## Notes

- The script maintains the original directory structure
- It skips empty directories and image directories in docs
- Translation is done using GPT-4.1
- Make sure you have sufficient OpenAI credits for translation 