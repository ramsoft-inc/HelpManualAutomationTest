/**
 * Demo script showing how to use the Claude provider
 * 
 * Usage:
 * 1. Set CLAUDE_API_KEY environment variable
 * 2. Optionally set CLAUDE_MODEL (defaults to claude-3-5-sonnet-20241022)
 * 3. Run: npx ts-node claude_demo.ts
 */

import { ClaudeProvider } from './src/llm_providers/claude_provider.js';
import { ClickableDomResult } from './src/page_helpers.js';
import * as fs from 'fs';

async function demonstrateClaudeProvider() {
  // Check if API key is set
  if (!process.env.CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY environment variable is not set');
    console.log('   Get your API key from: https://console.anthropic.com/');
    console.log('   Set it with: export CLAUDE_API_KEY=your_api_key_here');
    process.exit(1);
  }

  try {
    console.log('🔧 Initializing Claude provider...');
    const claudeProvider = new ClaudeProvider();
    console.log('✅ Claude provider initialized successfully');

    // Example usage (commented out since it requires real data)
    /*
    const mockDomResult: ClickableDomResult = {
      visibleElements: 'Example DOM content',
      pageType: 'dashboard',
      hierarchicalStructure: []
    };

    const mockScreenshot = Buffer.from('mock screenshot data');

    console.log('📤 Sending request to Claude...');
    const response = await claudeProvider.generateWithContext(
      'You are a helpful assistant',
      'Click the login button',
      mockDomResult,
      'https://example.com',
      mockScreenshot,
      '',
      '',
      true,
      true
    );

    console.log('📥 Response received:');
    console.log('Code:', response.code);
    console.log('Thinking:', response.thinking);
    console.log('Input tokens:', response.inputTokenCount);
    console.log('Output tokens:', response.outputTokenCount);
    */

    console.log('🎉 Claude provider is ready to use!');
    console.log('📋 Usage example:');
    console.log(`
import { ClaudeProvider } from './src/llm_providers/claude_provider.js';

const provider = new ClaudeProvider();
const response = await provider.generateWithContext(
  systemInstruction,
  scenarioText,
  domResult,
  pageUrl,
  screenshot,
  previouslyExecutedCode,
  currentStepErrorCode,
  includeSystemInstruction,
  isCodeAnswer,
  previousStepThinking
);
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

demonstrateClaudeProvider();
