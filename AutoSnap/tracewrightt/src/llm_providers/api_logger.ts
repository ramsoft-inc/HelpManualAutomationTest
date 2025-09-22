import * as fs from 'fs';
import * as path from 'path';
/**
 * Custom JSON serializer that handles circular references
 * @param obj The object to serialize
 * @returns A string representation of the object
 */
function safeStringify(obj: any, indent?: number): string {
  const cache = new Set();
  
  return JSON.stringify(obj, function(key, value) {
    // Handle null and undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle circular references
    if (typeof value === 'object') {
      if (cache.has(value)) {
        // Return a simplified representation for circular references
        return '[Circular Reference]';
      }
      cache.add(value);
    }
    
    // Handle special objects that can't be serialized
    if (value instanceof Error) {
      const error: Record<string, any> = {};
      Object.getOwnPropertyNames(value).forEach(prop => {
        error[prop] = (value as any)[prop];
      });
      return error;
    }
    
    // Handle request/response objects
    if (
      value && 
      typeof value === 'object' && 
      (
        (value.constructor && value.constructor.name === 'ClientRequest') ||
        (value.constructor && value.constructor.name === 'IncomingMessage') ||
        (key === 'socket' && typeof value === 'object') ||
        (key === 'client' && typeof value === 'object')
      )
    ) {
      return '[HTTP Object]';
    }
    
    return value;
  }, indent);
}

export interface APILogEntry {
  timestamp: string;
  provider: 'gemini' | 'openai' | 'claude';
  model: string;
  rawRequest: any; // Store the exact JSON payload sent to the model
  rawResponse: any; // Store the exact JSON response received from the model
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
  private logDir: string = '';
  private logFile: string = '';
  private geminiLogFile: string = '';
  private openaiLogFile: string = '';
  private claudeLogFile: string = '';

  constructor() {
    try {
      // Use absolute paths to avoid any working directory issues
      const rootDir = process.cwd();
      
      this.logDir = path.resolve(rootDir, 'api_logs');
      
      this.logFile = path.join(this.logDir, 'all_api_calls.json');
      this.geminiLogFile = path.join(this.logDir, 'gemini_calls.json');
      this.openaiLogFile = path.join(this.logDir, 'openai_calls.json');
      this.claudeLogFile = path.join(this.logDir, 'claude_calls.json');
      
      // Ensure log directory exists with proper permissions
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true, mode: 0o755 });
      } else {
        // Check if directory is writable
        try {
          const testFile = path.join(this.logDir, '.write_test');
          fs.writeFileSync(testFile, 'test', 'utf8');
          fs.unlinkSync(testFile);
        } catch (e) {
          // Directory might not be writable, but we'll try anyway
        }
      }
    } catch (error) {
      // Silent initialization error
    }
  }

  private logToFile(filePath: string, entry: APILogEntry) {
    try {
      let logs: APILogEntry[] = [];
      
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Read existing logs if file exists
      if (fs.existsSync(filePath)) {
        try {
          const existingContent = fs.readFileSync(filePath, 'utf8');
          if (existingContent && existingContent.trim()) {
            logs = JSON.parse(existingContent);
          } else {
            logs = [];
          }
        } catch (e) {
          // If file is corrupted, start fresh
          logs = [];
        }
      }
      
      // Add new entry
      logs.push(entry);
      
      // Write back to file - use a temporary file first to avoid corruption
      const tempFilePath = `${filePath}.tmp`;
      // Use safeStringify to handle circular references
      fs.writeFileSync(tempFilePath, safeStringify(logs, 2), 'utf8');
      
      // Rename temp file to target file (atomic operation)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete existing file first on Windows
      }
      fs.renameSync(tempFilePath, filePath);
    } catch (error) {
      // Try a more direct approach as fallback
      try {
        const backupPath = path.join(process.cwd(), 'api_log_backup.json');
        // Use safeStringify for backup location too
        fs.writeFileSync(backupPath, safeStringify([entry], 2), 'utf8');
      } catch (backupError) {
        // Silent failure
      }
    }
  }

  logAPICall(entry: APILogEntry) {
    try {
      // Ensure entry has all required fields
      if (!entry.timestamp) {
        entry.timestamp = new Date().toISOString();
      }
      
      // Log to main file
      this.logToFile(this.logFile, entry);
      
      // Log to provider-specific file
      if (entry.provider === 'gemini') {
        this.logToFile(this.geminiLogFile, entry);
      } else if (entry.provider === 'openai') {
        this.logToFile(this.openaiLogFile, entry);
      } else if (entry.provider === 'claude') {
        this.logToFile(this.claudeLogFile, entry);
      } else {
        // Silent logging for unknown provider, only to main file
      }
    } catch (error) {
      // Last resort - try to write to a simple file in the current directory
      try {
        const emergencyPath = path.join(process.cwd(), 'emergency_api_log.json');
        fs.writeFileSync(emergencyPath, JSON.stringify(entry, null, 2), 'utf8');
      } catch (e) {
        // Silent complete failure
      }
    }
  }

  getLogs(provider?: 'gemini' | 'openai' | 'claude'): APILogEntry[] {
    try {
      let filePath: string;
      
      if (provider === 'gemini') {
        filePath = this.geminiLogFile;
      } else if (provider === 'openai') {
        filePath = this.openaiLogFile;
      } else if (provider === 'claude') {
        filePath = this.claudeLogFile;
      } else {
        filePath = this.logFile;
      }
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
      
      return [];
    } catch (error) {
      // Silent failure
      return [];
    }
  }

  clearLogs(provider?: 'gemini' | 'openai' | 'claude') {
    try {
      if (provider === 'gemini') {
        if (fs.existsSync(this.geminiLogFile)) {
          fs.unlinkSync(this.geminiLogFile);
        }
      } else if (provider === 'openai') {
        if (fs.existsSync(this.openaiLogFile)) {
          fs.unlinkSync(this.openaiLogFile);
        }
      } else if (provider === 'claude') {
        if (fs.existsSync(this.claudeLogFile)) {
          fs.unlinkSync(this.claudeLogFile);
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
        if (fs.existsSync(this.claudeLogFile)) {
          fs.unlinkSync(this.claudeLogFile);
        }
      }
    } catch (error) {
      // Silent failure
    }
  }
}

// Global logger instance
export const apiLogger = new APILogger(); 