import { apiLogger, APILogEntry } from './api_logger';
import * as fs from 'fs';
import * as path from 'path';

export class LogViewer {
  private logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'api_logs');
  }

  /**
   * Display a summary of all API calls
   */
  showSummary() {
    const allLogs = apiLogger.getLogs();
    
    if (allLogs.length === 0) {
      console.log('📊 No API logs found');
      return;
    }

    const geminiLogs = allLogs.filter(log => log.provider === 'gemini');
    const openaiLogs = allLogs.filter(log => log.provider === 'openai');

    console.log('\n📊 API Call Summary');
    console.log('==================');
    console.log(`Total calls: ${allLogs.length}`);
    console.log(`Gemini calls: ${geminiLogs.length}`);
    console.log(`OpenAI calls: ${openaiLogs.length}`);

    if (geminiLogs.length > 0) {
      const avgGeminiTokens = geminiLogs.reduce((sum, log) => sum + log.response.totalTokens, 0) / geminiLogs.length;
      const avgGeminiDuration = geminiLogs.reduce((sum, log) => sum + log.duration, 0) / geminiLogs.length;
      console.log(`\n🤖 Gemini Stats:`);
      console.log(`  Average tokens: ${Math.round(avgGeminiTokens)}`);
      console.log(`  Average duration: ${Math.round(avgGeminiDuration)}ms`);
    }

    if (openaiLogs.length > 0) {
      const avgOpenAITokens = openaiLogs.reduce((sum, log) => sum + log.response.totalTokens, 0) / openaiLogs.length;
      const avgOpenAIDuration = openaiLogs.reduce((sum, log) => sum + log.duration, 0) / openaiLogs.length;
      console.log(`\n🧠 OpenAI Stats:`);
      console.log(`  Average tokens: ${Math.round(avgOpenAITokens)}`);
      console.log(`  Average duration: ${Math.round(avgOpenAIDuration)}ms`);
    }
  }

  /**
   * Display detailed logs for a specific provider
   */
  showDetailedLogs(provider?: 'gemini' | 'openai') {
    const logs = apiLogger.getLogs(provider);
    
    if (logs.length === 0) {
      console.log(`📊 No ${provider || 'API'} logs found`);
      return;
    }

    console.log(`\n📋 Detailed ${provider || 'API'} Logs (${logs.length} entries)`);
    console.log('='.repeat(60));

    logs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.timestamp}`);
      console.log(`   Provider: ${log.provider.toUpperCase()}`);
      console.log(`   Model: ${log.model}`);
      console.log(`   Duration: ${log.duration}ms`);
      console.log(`   Tokens: ${log.response.inputTokenCount} input + ${log.response.outputTokenCount} output = ${log.response.totalTokens} total`);
      console.log(`   Status: ${log.response.status}`);
      
      if (log.request.pageUrl) {
        console.log(`   URL: ${log.request.pageUrl}`);
      }
      
      console.log(`   System Instruction: ${log.request.systemInstruction.substring(0, 100)}...`);
      console.log(`   User Prompt: ${log.request.userPrompt.substring(0, 100)}...`);
      
      if (log.response.thinking) {
        console.log(`   Thinking: ${log.response.thinking.substring(0, 100)}...`);
      }
      
      if (log.response.code && log.response.code !== 'done' && log.response.code !== 'error') {
        console.log(`   Generated Code: ${log.response.code.substring(0, 100)}...`);
      }
    });
  }

  /**
   * Show the latest API call details
   */
  showLatestCall(provider?: 'gemini' | 'openai') {
    const logs = apiLogger.getLogs(provider);
    
    if (logs.length === 0) {
      console.log(`📊 No ${provider || 'API'} logs found`);
      return;
    }

    const latest = logs[logs.length - 1];
    
    console.log(`\n🕒 Latest ${latest.provider.toUpperCase()} API Call`);
    console.log('='.repeat(50));
    console.log(`Timestamp: ${latest.timestamp}`);
    console.log(`Model: ${latest.model}`);
    console.log(`Duration: ${latest.duration}ms`);
    console.log(`Status: ${latest.response.status}`);
    console.log(`Tokens: ${latest.response.inputTokenCount} input + ${latest.response.outputTokenCount} output = ${latest.response.totalTokens} total`);
    
    if (latest.request.pageUrl) {
      console.log(`URL: ${latest.request.pageUrl}`);
    }
    
    console.log(`\n📝 System Instruction:`);
    console.log(latest.request.systemInstruction);
    
    console.log(`\n💬 User Prompt:`);
    console.log(latest.request.userPrompt);
    
    if (latest.response.thinking) {
      console.log(`\n🤔 AI Thinking:`);
      console.log(latest.response.thinking);
    }
    
    if (latest.response.code && latest.response.code !== 'done' && latest.response.code !== 'error') {
      console.log(`\n💻 Generated Code:`);
      console.log(latest.response.code);
    }
    
    console.log(`\n📊 Request Details:`);
    console.log(`- Has Image: ${latest.request.hasImage}`);
    console.log(`- Image Size: ${latest.request.imageSize} bytes`);
    console.log(`- Visible Elements: ${latest.request.visibleElementsLength} characters`);
    console.log(`- Temperature: ${latest.metadata.temperature}`);
    if (latest.metadata.maxTokens) {
      console.log(`- Max Tokens: ${latest.metadata.maxTokens}`);
    }
  }

  /**
   * Export logs to a readable format
   */
  exportLogs(provider?: 'gemini' | 'openai', format: 'json' | 'txt' = 'txt') {
    const logs = apiLogger.getLogs(provider);
    
    if (logs.length === 0) {
      console.log(`📊 No ${provider || 'API'} logs found to export`);
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const providerName = provider || 'all';
    
    if (format === 'json') {
      const exportPath = path.join(this.logDir, `${providerName}_logs_${timestamp}.json`);
      fs.writeFileSync(exportPath, JSON.stringify(logs, null, 2));
      console.log(`📁 Exported ${logs.length} logs to: ${exportPath}`);
    } else {
      const exportPath = path.join(this.logDir, `${providerName}_logs_${timestamp}.txt`);
      let content = `${providerName.toUpperCase()} API Logs - ${new Date().toISOString()}\n`;
      content += '='.repeat(60) + '\n\n';
      
      logs.forEach((log, index) => {
        content += `${index + 1}. ${log.timestamp}\n`;
        content += `   Provider: ${log.provider.toUpperCase()}\n`;
        content += `   Model: ${log.model}\n`;
        content += `   Duration: ${log.duration}ms\n`;
        content += `   Tokens: ${log.response.totalTokens} total\n`;
        content += `   Status: ${log.response.status}\n`;
        content += `   URL: ${log.request.pageUrl || 'N/A'}\n`;
        content += `   System Instruction: ${log.request.systemInstruction}\n`;
        content += `   User Prompt: ${log.request.userPrompt}\n`;
        if (log.response.thinking) {
          content += `   Thinking: ${log.response.thinking}\n`;
        }
        if (log.response.code && log.response.code !== 'done' && log.response.code !== 'error') {
          content += `   Generated Code: ${log.response.code}\n`;
        }
        content += '\n' + '-'.repeat(40) + '\n\n';
      });
      
      fs.writeFileSync(exportPath, content);
      console.log(`📁 Exported ${logs.length} logs to: ${exportPath}`);
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(provider?: 'gemini' | 'openai') {
    apiLogger.clearLogs(provider);
    const providerName = provider || 'all';
    console.log(`🗑️  Cleared ${providerName} API logs`);
  }
}

// CLI interface
if (require.main === module) {
  const viewer = new LogViewer();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    viewer.showSummary();
  } else {
    const command = args[0];
    const provider = args[1] as 'gemini' | 'openai' | undefined;
    
    switch (command) {
      case 'summary':
        viewer.showSummary();
        break;
      case 'detailed':
        viewer.showDetailedLogs(provider);
        break;
      case 'latest':
        viewer.showLatestCall(provider);
        break;
      case 'export':
        const format = args[2] as 'json' | 'txt' || 'txt';
        viewer.exportLogs(provider, format);
        break;
      case 'clear':
        viewer.clearLogs(provider);
        break;
      default:
        console.log('Usage:');
        console.log('  node log_viewer.js summary');
        console.log('  node log_viewer.js detailed [gemini|openai]');
        console.log('  node log_viewer.js latest [gemini|openai]');
        console.log('  node log_viewer.js export [gemini|openai] [json|txt]');
        console.log('  node log_viewer.js clear [gemini|openai]');
    }
  }
} 