import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { POMScanner, MethodMetadata } from "./pom_scanner.js";
import { POMMethodFilter, FilteredMethod } from "./pom_filter.js";

const requireFromHere = createRequire(import.meta.url);
const currentFileDir = path.dirname(fileURLToPath(import.meta.url));

type POManagerCtor = new (page: Page | unknown, apiContext: unknown, testInfo: unknown) => any;

const createPageStub = (): Record<string, unknown> => {
  const locatorStub = new Proxy(
    {},
    {
      get: () =>
        () => locatorStub,
    }
  );

  return new Proxy(
    {},
    {
      get: (_, key) => {
        if (key === "locator" || key === "getByRole" || key === "getByTestId" || key === "getByLabel" || key === "getByText") {
          return () => locatorStub;
        }
        return () => undefined;
      },
    }
  );
};

interface URLPattern {
  pattern: string;
  type: 'includes' | 'regex';
  pages: string[];
  priority: number;
  description?: string;
}

interface URLConfig {
  urlPatterns: URLPattern[];
  fallbackPages: string[];
  description?: string;
}

export class POMContextManager {
  public poManager: any;
  private static cachedPOManagerCtor: POManagerCtor | null = null;
  private scanner: POMScanner | null = null;
  private urlConfig: URLConfig | null = null;
  private repoRoot: string | null = null;

  private constructor(page: Page, POManagerCtor: POManagerCtor) {
    this.poManager = new POManagerCtor(page, null, null);
  }

  static async create(page: Page): Promise<POMContextManager> {
    const POManager = await POMContextManager.getPOManagerCtor();
    const instance = new POMContextManager(page, POManager);
    
    // Initialize scanner and URL config
    const { repoRoot } = await POMContextManager.preflightPOManager();
    instance.repoRoot = repoRoot;
    
    // Try to load cross-repo configuration first
    let pomDir: string = '';
    let filterPath: string = '';
    
    const repoConfigPath = path.join(repoRoot, "AutoSnap", "repo_config.json");
    if (fs.existsSync(repoConfigPath)) {
      try {
        const repoConfig = JSON.parse(fs.readFileSync(repoConfigPath, 'utf8'));
        
        // Check if GitHub-based sync is configured
        if (repoConfig.targetRepo.owner && repoConfig.targetRepo.repo) {
          console.log('✅ GitHub-based configuration detected');
          
          // Try multiple cache locations (sync manager saves to AutoSnap/.cache, but also check repo root)
          const cacheDirs = [
            path.join(repoRoot, "AutoSnap", ".cache", "filtered-pom"),  // Where sync manager actually saves
            path.join(repoRoot, ".cache", "filtered-pom")               // Alternative location
          ];
          
          let foundCache = false;
          for (const cacheDir of cacheDirs) {
            if (fs.existsSync(cacheDir)) {
              console.log(`✅ Using cached filtered POMs from GitHub sync: ${cacheDir}`);
              pomDir = cacheDir;
              foundCache = true;
              break;
            }
          }
          
          if (!foundCache) {
            console.warn('⚠️  Cache not found. Run "npm run sync-pom" to fetch from GitHub');
            
            // Try legacy local path as fallback
            if (repoConfig.legacy && repoConfig.legacy.localPath) {
              const legacyPomDir = path.join(repoConfig.legacy.localPath, repoConfig.paths.pomDirectory);
              if (fs.existsSync(legacyPomDir)) {
                console.log('✅ Using legacy local filesystem path as fallback');
                pomDir = legacyPomDir;
              } else {
                throw new Error('POM files not found. Run "npm run sync-pom" to fetch from GitHub.');
              }
            } else {
              throw new Error('POM files not found. Run "npm run sync-pom" to fetch from GitHub.');
            }
          }
          
          filterPath = path.join(repoRoot, "AutoSnap", repoConfig.paths.usedMethodsFilter);
        } else {
          // Legacy filesystem-based configuration
        pomDir = repoConfig.paths.pomDirectory;
        filterPath = repoConfig.paths.usedMethodsFilter;
          console.log('✅ Using legacy filesystem-based configuration');
        }
        
        console.log(`   POM directory: ${pomDir}`);
        console.log(`   Filter file: ${filterPath}`);
      } catch (error) {
        console.warn('⚠️  Failed to parse repo_config.json, falling back to local paths');
        pomDir = fs.existsSync(path.join(repoRoot, "AutoSnap", "POM"))
          ? path.join(repoRoot, "AutoSnap", "POM")
          : path.join(repoRoot, "playwright", "POM");
        filterPath = path.join(repoRoot, "AutoSnap", "used_pom_methods.json");
      }
    } else {
      // Fallback: Try AutoSnap first, then playwright (same repo)
      pomDir = fs.existsSync(path.join(repoRoot, "AutoSnap", "POM"))
        ? path.join(repoRoot, "AutoSnap", "POM")
        : path.join(repoRoot, "playwright", "POM");
      filterPath = path.join(repoRoot, "AutoSnap", "used_pom_methods.json");
    }
    
    instance.scanner = new POMScanner(pomDir, filterPath);
    
    // Load URL config
    const configPath = path.join(repoRoot, "AutoSnap", "pom_url_config.json");
    if (fs.existsSync(configPath)) {
      instance.urlConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    return instance;
  }

  static resolveRepoRoot(startDir: string = process.cwd()): string {
    const searchSeeds = [startDir, currentFileDir];

    for (const seed of searchSeeds) {
      let cursor = path.resolve(seed);
      while (true) {
        // Look for POM in multiple locations (prioritize cache):
        // 1. Cached filtered POMs from GitHub sync (AutoSnap/.cache - where sync manager saves)
        // 2. Cached filtered POMs from GitHub sync (repo root/.cache - alternative)
        // 3. AutoSnap/POM (self-contained)
        // 4. playwright/POM (legacy)
        const cacheCandidate1 = path.join(cursor, "AutoSnap", ".cache", "filtered-pom", "POManager.js");
        const cacheCandidate2 = path.join(cursor, ".cache", "filtered-pom", "POManager.js");
        const autoSnapCandidate = path.join(cursor, "AutoSnap", "POM", "POManager.js");
        const playwrightCandidate = path.join(cursor, "playwright", "POM", "POManager.js");
        
        // Check cache first (prioritize GitHub sync cache)
        if (fs.existsSync(cacheCandidate1)) {
          console.log(`✅ Found POManager in GitHub sync cache at: ${cacheCandidate1}`);
          return cursor;
        }
        if (fs.existsSync(cacheCandidate2)) {
          console.log(`✅ Found POManager in GitHub sync cache at: ${cacheCandidate2}`);
          return cursor;
        }
        // Fallback to local POMs
        if (fs.existsSync(autoSnapCandidate)) {
          console.log(`⚠️  Found POManager in AutoSnap (not using cache) at: ${autoSnapCandidate}`);
          return cursor;
        }
        if (fs.existsSync(playwrightCandidate)) {
          console.log(`⚠️  Found POManager in playwright (not using cache) at: ${playwrightCandidate}`);
          return cursor;
        }
        
        const parent = path.dirname(cursor);
        if (parent === cursor) {
          break;
        }
        cursor = parent;
      }
    }

    throw new Error(
      "POManager preflight failed: unable to resolve repository root containing AutoSnap/.cache/filtered-pom/POManager.js, .cache/filtered-pom/POManager.js, AutoSnap/POM/POManager.js, or playwright/POM/POManager.js."
    );
  }

  static async preflightPOManager(startDir: string = process.cwd()): Promise<{ repoRoot: string; poManagerPath: string }> {
    const repoRoot = POMContextManager.resolveRepoRoot(startDir);
    
    // Try multiple locations: cache (GitHub sync - AutoSnap/.cache), cache (repo root/.cache), AutoSnap, then playwright
    let poManagerPath = path.join(repoRoot, "AutoSnap", ".cache", "filtered-pom", "POManager.js");
    if (!fs.existsSync(poManagerPath)) {
      poManagerPath = path.join(repoRoot, ".cache", "filtered-pom", "POManager.js");
    }
    if (!fs.existsSync(poManagerPath)) {
      poManagerPath = path.join(repoRoot, "AutoSnap", "POM", "POManager.js");
    }
    if (!fs.existsSync(poManagerPath)) {
      poManagerPath = path.join(repoRoot, "playwright", "POM", "POManager.js");
    }
    console.log(`Using POManager at: ${poManagerPath}`);

    // Use dynamic import to handle any module format (ESM, CJS, or mixed)
    let loadedModule: any;
    try {
      console.log(`Attempting to import POManager from: ${poManagerPath}`);
      const fileUrl = new URL(`file:///${poManagerPath.replace(/\\/g, '/')}`).href;
      loadedModule = await import(fileUrl);
      console.log("✅ Successfully imported POManager module.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `POManager preflight failed while loading "${poManagerPath}". Root cause: ${reason}`
      );
    }

    const ctor = loadedModule.POManager || loadedModule.default?.POManager || loadedModule.default;
    if (typeof ctor !== "function") {
      throw new Error(
        `POManager preflight failed: "${poManagerPath}" does not export a POManager constructor.`
      );
    }

    try {
      new (ctor as POManagerCtor)(createPageStub(), null, null);
      console.log("✅ POManager preflight passed: constructor works.");
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `POManager preflight failed: constructor initialization crashed. Root cause: ${reason}`
      );
    }

    this.cachedPOManagerCtor = ctor as POManagerCtor;
    return { repoRoot, poManagerPath };
  }

  private static async getPOManagerCtor(): Promise<POManagerCtor> {
    if (this.cachedPOManagerCtor) {
      return this.cachedPOManagerCtor;
    }

    await this.preflightPOManager();
    if (!this.cachedPOManagerCtor) {
      throw new Error("POManager preflight did not cache a constructor.");
    }
    return this.cachedPOManagerCtor;
  }

  /**
   * Determines which POM pages are active based on the URL
   * Returns array of page names sorted by priority
   */
  detectActivePages(url: string): string[] {
    if (this.urlConfig) {
      // Use config-based detection
      const matches: Array<{ pages: string[]; priority: number }> = [];
      
      for (const pattern of this.urlConfig.urlPatterns) {
        let isMatch = false;
        
        if (pattern.type === 'includes') {
          isMatch = url.toLowerCase().includes(pattern.pattern.toLowerCase());
        } else if (pattern.type === 'regex') {
          const regex = new RegExp(pattern.pattern, 'i');
          isMatch = regex.test(url);
        }
        
        if (isMatch) {
          matches.push({ pages: pattern.pages, priority: pattern.priority });
        }
      }
      
      // Sort by priority (highest first) and flatten
      matches.sort((a, b) => b.priority - a.priority);
      const allPages = matches.flatMap(m => m.pages);
      
      // Remove duplicates while preserving order
      return Array.from(new Set(allPages));
    }
    
    // Fallback to hardcoded detection (backward compatibility)
    const lowerUrl = url.toLowerCase();
    const pages: string[] = [];
    
    if (lowerUrl.includes("/viewer")) pages.push("documentViewer");
    if (lowerUrl.includes("/study")) pages.push("studyInfoPage");
    if (lowerUrl.includes("/login") || lowerUrl.includes("auth")) pages.push("loginPage");
    if (lowerUrl.includes("/worklist") || lowerUrl.includes("/home")) {
      pages.push("homePage");
      pages.push("rightClickMenu"); // Right-click menu is available on worklist
    }
    if (lowerUrl.includes("/patient")) pages.push("patientInformationPage");
    if (lowerUrl.includes("/scheduler")) pages.push("scheduler");
    if (lowerUrl.includes("/organization")) pages.push("organizationDirectoryPage");
    
    // Add common pages
    pages.push("common", "sidebar");
    
    return pages.length > 0 ? pages : ["common"];
  }
  
  /**
   * Legacy method for backward compatibility
   * Returns the first detected page
   */
  detectActivePage(url: string): string | null {
    const pages = this.detectActivePages(url);
    return pages.length > 0 ? pages[0] : null;
  }

  /**
   * Returns a text description of available actions for the AI prompt
   * Now with smart filtering based on user instructions
   */
  async getAvailableActions(url: string, userInstructions: string = ""): Promise<string> {
    if (!this.scanner) {
      console.warn("POM Scanner not initialized");
      return "";
    }

    try {
      const pageNames = this.detectActivePages(url);
      if (pageNames.length === 0) return "";

      let allOutput = "";
      
      // Process each detected page
      for (const pageName of pageNames) {
        const methods = await this.scanner.getMethodsForPage(pageName);
        
        if (methods.length === 0) continue;

        // Apply smart filtering if user instructions provided
        let filteredMethods: FilteredMethod[];
        if (userInstructions && userInstructions.trim().length > 0) {
          filteredMethods = POMMethodFilter.filterMethods(methods, userInstructions, {
            maxMethods: 30, // Limit per page
            excludeDeprecated: true,
            minScore: 1, // Only include methods with some relevance
          });
        } else {
          // No filtering, but still limit and exclude deprecated
          filteredMethods = methods
            .filter(m => !m.deprecated)
            .slice(0, 40)
            .map(m => ({ ...m, score: 0, matchReasons: [] }));
        }

        if (filteredMethods.length > 0) {
          allOutput += POMMethodFilter.formatForLLM(filteredMethods, pageName, false);
        }
      }

      return allOutput;
    } catch (e) {
      console.warn(`Error extracting POM actions:`, e);
      return "";
    }
  }

  /**
   * Legacy synchronous version for backward compatibility
   * Uses fallback to old method extraction
   */
  getAvailableActionsSync(url: string): string {
    const pageName = this.detectActivePage(url);
    if (!pageName) return "";

    try {
        // Some POM properties are getters or instantiated in constructor
        let pageObject = this.poManager[pageName];
        
        // If it's a function (getter method style in POManager), call it
        if (typeof pageObject === 'function') {
            pageObject = pageObject.call(this.poManager);
        }

        if (!pageObject) return "";

        // Get methods from the prototype
        const prototypes = Object.getPrototypeOf(pageObject);
        const methods = Object.getOwnPropertyNames(prototypes)
        .filter(m => 
            m !== "constructor" && 
            !m.startsWith("_") &&
            typeof pageObject[m] === 'function'
        );

        if (methods.length === 0) return "";

        // Format for AI (limit to 40 methods)
        const limitedMethods = methods.slice(0, 40);
        const actionList = limitedMethods.map(method => `- po.${pageName}.${method}()`).join("\n");

        return `
### 🛠️ AVAILABLE TOOLS (Page: ${pageName})
Use 'po.${pageName}.methodName()' to access these reliable selectors.
${actionList}
`;
    } catch (e) {
        console.warn(`Error extracting actions for ${pageName}:`, e);
        return "";
    }
  }
}
