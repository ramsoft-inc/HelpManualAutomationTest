import * as fs from 'fs';
import * as path from 'path';

export interface APILogEntry {
  timestamp: string;
  provider: 'gemini' | 'openai';
  model: string;
  request: {
    systemInstruction: string;
    userPrompt: string;
    hasImage: boolean;
    imageSize?: number;
    hasHighlightedImage?: boolean;
    highlightedImageSize?: number;
    pageUrl?: string;
    visibleElementsLength?: number;
    previouslyExecutedCode?: string;
    currentStepErrorCode?: string;
  };
  response: {
    status: number;
    content: string;
    inputTokenCount: number;
    outputTokenCount: number;
    totalTokens: number;
    thinking?: string;
    code?: string;
  };
  metadata: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    safetySettings?: any[];
  };
  duration: number;
}

export class APILogger {
  private logDir: string;
  private logFile: string;
  private geminiLogFile: string;
  private openaiLogFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), 'api_logs');
    this.logFile = path.join(this.logDir, 'all_api_calls.json');
    this.geminiLogFile = path.join(this.logDir, 'gemini_calls.json');
    this.openaiLogFile = path.join(this.logDir, 'openai_calls.json');
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private logToFile(filePath: string, entry: APILogEntry) {
    try {
      let logs: APILogEntry[] = [];
      
      // Read existing logs if file exists
      if (fs.existsSync(filePath)) {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        try {
          logs = JSON.parse(existingContent);
        } catch (e) {
          // If file is corrupted, start fresh
          logs = [];
        }
      }
      
      // Add new entry
      logs.push(entry);
      
      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
    } catch (error) {
      console.warn('⚠️ Failed to write API log:', error);
    }
  }

  logAPICall(entry: APILogEntry) {
    // Log to main file
    this.logToFile(this.logFile, entry);
    
    // Log to provider-specific file
    if (entry.provider === 'gemini') {
      this.logToFile(this.geminiLogFile, entry);
    } else if (entry.provider === 'openai') {
      this.logToFile(this.openaiLogFile, entry);
    }
  }

  getLogs(provider?: 'gemini' | 'openai'): APILogEntry[] {
    try {
      let filePath: string;
      
      if (provider === 'gemini') {
        filePath = this.geminiLogFile;
      } else if (provider === 'openai') {
        filePath = this.openaiLogFile;
      } else {
        filePath = this.logFile;
      }
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
      
      return [];
    } catch (error) {
      console.warn('⚠️ Failed to read API logs:', error);
      return [];
    }
  }

  clearLogs(provider?: 'gemini' | 'openai') {
    try {
      if (provider === 'gemini') {
        if (fs.existsSync(this.geminiLogFile)) {
          fs.unlinkSync(this.geminiLogFile);
        }
      } else if (provider === 'openai') {
        if (fs.existsSync(this.openaiLogFile)) {
          fs.unlinkSync(this.openaiLogFile);
        }
      } else {
        if (fs.existsSync(this.logFile)) {
          fs.unlinkSync(this.logFile);
        }
        if (fs.existsSync(this.geminiLogFile)) {
          fs.unlinkSync(this.geminiLogFile);
        }
        if (fs.existsSync(this.openaiLogFile)) {
          fs.unlinkSync(this.openaiLogFile);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear API logs:', error);
    }
  }
}

// Global logger instance
export const apiLogger = new APILogger(); 