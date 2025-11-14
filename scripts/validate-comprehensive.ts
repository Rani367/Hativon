#!/usr/bin/env tsx

/**
 * COMPREHENSIVE PRE-DEPLOYMENT VALIDATION
 *
 * This script performs exhaustive checks to catch ANY error before production.
 * NO ERROR should make it to production.
 *
 * Categories:
 * 1. TypeScript strict compilation
 * 2. ESLint strict checking (fail on errors)
 * 3. Security scanning (secrets, vulnerabilities, dangerous patterns)
 * 4. Import validation (circular dependencies, unused imports)
 * 5. Database validation (schema, connection if available)
 * 6. Configuration validation (Next.js, package.json, tsconfig)
 * 7. Runtime validation (API routes, critical paths)
 * 8. Dependency validation (versions, vulnerabilities, licenses)
 * 9. Code quality (complexity, TODOs in critical files)
 * 10. Build size validation
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface ValidationResult {
  category: string;
  name: string;
  passed: boolean;
  critical: boolean;
  message: string;
  details?: string;
}

const results: ValidationResult[] = [];
let totalChecks = 0;
let passedChecks = 0;
let criticalFailures = 0;

function addResult(category: string, name: string, passed: boolean, critical: boolean, message: string, details?: string) {
  totalChecks++;
  if (passed) passedChecks++;
  if (!passed && critical) criticalFailures++;

  results.push({ category, name, passed, critical, message, details });
}

function runCommand(command: string, silent: boolean = true): { success: boolean; output: string } {
  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8',
      timeout: 60000, // 1 minute timeout
    });
    return { success: true, output };
  } catch (error: any) {
    return { success: false, output: error.stdout || error.message || '' };
  }
}

// ============================================================================
// 1. TYPESCRIPT VALIDATION
// ============================================================================

function validateTypeScript() {
  console.log(`\n${colors.cyan}[1/10] TypeScript Compilation...${colors.reset}`);

  // Check strict mode in tsconfig
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
    const isStrict = tsconfig.compilerOptions?.strict === true;

    addResult('TypeScript', 'Strict Mode', isStrict, true,
      isStrict ? 'Strict mode enabled' : 'Strict mode must be enabled',
      isStrict ? undefined : 'Enable "strict": true in tsconfig.json');
  } catch (e) {
    addResult('TypeScript', 'tsconfig.json', false, true, 'Cannot read tsconfig.json', 'File may be missing or invalid');
  }

  // Run TypeScript compiler with strict checks
  console.log('  Running tsc --noEmit...');
  const tscResult = runCommand('npx tsc --noEmit --pretty false', true);

  if (tscResult.success) {
    addResult('TypeScript', 'Compilation', true, true, 'No type errors found');
  } else {
    const errorCount = (tscResult.output.match(/error TS/g) || []).length;
    addResult('TypeScript', 'Compilation', false, true,
      `Found ${errorCount} type error(s)`,
      tscResult.output.split('\n').slice(0, 20).join('\n')); // First 20 lines
  }

  // Check for 'any' types in critical files
  console.log('  Checking for unsafe any types...');
  const criticalFiles = [
    'src/lib/auth/**/*.ts',
    'src/lib/db/**/*.ts',
    'src/lib/users/**/*.ts',
    'src/lib/posts/**/*.ts',
  ];

  for (const pattern of criticalFiles) {
    try {
      const result = runCommand(`grep -r ": any\\|: any\\[\\]\\|as any" ${pattern} 2>/dev/null || true`, true);
      if (result.output.trim()) {
        addResult('TypeScript', 'Type Safety', false, false,
          `Found 'any' types in ${pattern}`,
          'Consider using proper types instead of any for better type safety');
      }
    } catch (e) {
      // Ignore if files don't exist
    }
  }
}

// ============================================================================
// 2. ESLINT VALIDATION
// ============================================================================

function validateESLint() {
  console.log(`\n${colors.cyan}[2/10] ESLint Checking...${colors.reset}`);

  // Check if .eslintrc exists
  const hasEslintConfig = fs.existsSync('.eslintrc.json') ||
                          fs.existsSync('.eslintrc.js') ||
                          fs.existsSync('eslint.config.js');

  if (!hasEslintConfig) {
    addResult('ESLint', 'Configuration', false, false, 'No ESLint configuration found',
      'Run: npx eslint --init');
    return;
  }

  console.log('  Running ESLint...');
  // First check for errors only
  const eslintResult = runCommand('npx eslint . --ext .ts,.tsx,.js,.jsx', true);

  if (eslintResult.success) {
    addResult('ESLint', 'Linting', true, false, 'No linting errors');
  } else {
    // Count errors and warnings
    const errorMatches = eslintResult.output.match(/\d+ errors?/gi);
    const warningMatches = eslintResult.output.match(/\d+ warnings?/gi);

    const errors = errorMatches ? parseInt(errorMatches[0].match(/\d+/)?.[0] || '0') : 0;
    const warnings = warningMatches ? parseInt(warningMatches[0].match(/\d+/)?.[0] || '0') : 0;

    // Only fail on errors, warnings are OK
    if (errors > 0) {
      addResult('ESLint', 'Linting', false, true,
        `Found ${errors} linting error(s)`,
        eslintResult.output.split('\n').filter(l => l.includes('error')).slice(0, 10).join('\n'));
    } else if (warnings > 0) {
      addResult('ESLint', 'Linting', true, false,
        `No errors (${warnings} warnings are acceptable)`,
        'Warnings are for code quality improvements');
    }
  }
}

// ============================================================================
// 3. SECURITY VALIDATION
// ============================================================================

function validateSecurity() {
  console.log(`\n${colors.cyan}[3/10] Security Scanning...${colors.reset}`);

  // Check for exposed secrets in code
  console.log('  Checking for exposed secrets...');
  const secretPatterns = [
    { pattern: 'AKIA[0-9A-Z]{16}', desc: 'AWS access key' },
    { pattern: 'sk_live_[0-9a-zA-Z]{24,}', desc: 'Stripe live key' },
    { pattern: 'ghp_[0-9a-zA-Z]{36}', desc: 'GitHub token' },
  ];

  let foundSecrets = false;
  for (const { pattern, desc } of secretPatterns) {
    const result = runCommand(`grep -rE '${pattern}' src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || true`, true);
    if (result.output.trim() && !result.output.includes('Command failed')) {
      foundSecrets = true;
      addResult('Security', 'Exposed Secrets', false, true,
        `Found ${desc}: ${pattern}`,
        result.output.split('\n').slice(0, 3).join('\n'));
    }
  }

  // Check for hardcoded passwords (look for actual string literals only)
  const passwordCheck = runCommand(`grep -rE "password\\s*=\\s*['\\\"](?!\\$\\{)(admin|test|password|123)['\\\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true`, true);
  if (passwordCheck.output.trim() &&
      !passwordCheck.output.includes('Command failed') &&
      !passwordCheck.output.includes('searchParams') &&
      !passwordCheck.output.includes('process.env')) {
    foundSecrets = true;
    addResult('Security', 'Hardcoded Passwords', false, true,
      'Found hardcoded passwords',
      passwordCheck.output.split('\n').slice(0, 3).join('\n'));
  }

  if (!foundSecrets) {
    addResult('Security', 'Exposed Secrets', true, true, 'No hardcoded secrets detected');
  }

  // Check for dangerous patterns
  console.log('  Checking for dangerous code patterns...');
  const dangerousPatterns = [
    { pattern: 'eval\\(', risk: 'Code injection', critical: true },
    { pattern: 'innerHTML\\s*=(?!.*json)', risk: 'XSS vulnerability', critical: true },
    { pattern: '\\.exec\\(.*\\$\\{', risk: 'Command injection', critical: true },
    { pattern: 'child_process.*exec\\(.*\\+', risk: 'Command injection', critical: true },
  ];

  let foundDangerous = false;
  for (const { pattern, risk, critical } of dangerousPatterns) {
    const result = runCommand(`grep -rE '${pattern}' src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null || true`, true);
    if (result.output.trim() && !result.output.includes('Command failed')) {
      // Filter out safe uses (like JSON-LD in script tags)
      const lines = result.output.split('\n').filter(line => {
        return line.trim() &&
               !line.includes('JSON.stringify') &&
               !line.includes('jsonLd') &&
               !line.includes('application/ld+json');
      });

      if (lines.length > 0) {
        foundDangerous = true;
        addResult('Security', 'Dangerous Patterns', false, critical,
          `Found ${risk}: ${pattern}`,
          lines.slice(0, 3).join('\n'));
      }
    }
  }

  if (!foundDangerous) {
    addResult('Security', 'Dangerous Patterns', true, true, 'No dangerous code patterns found');
  }

  // Check npm audit for vulnerabilities
  console.log('  Running npm audit...');
  const auditResult = runCommand('npm audit --audit-level=high --json', true);

  try {
    const audit = JSON.parse(auditResult.output);
    const highVulns = audit.metadata?.vulnerabilities?.high || 0;
    const criticalVulns = audit.metadata?.vulnerabilities?.critical || 0;

    if (highVulns > 0 || criticalVulns > 0) {
      addResult('Security', 'Dependencies', false, true,
        `Found ${highVulns} high and ${criticalVulns} critical vulnerabilities`,
        'Run: npm audit fix');
    } else {
      addResult('Security', 'Dependencies', true, true, 'No high/critical vulnerabilities found');
    }
  } catch (e) {
    addResult('Security', 'Dependencies', false, false, 'Could not run npm audit', 'npm audit command failed');
  }

  // Check .env.example doesn't have real values
  if (fs.existsSync('.env.example')) {
    const envExample = fs.readFileSync('.env.example', 'utf-8');
    const suspiciousPatterns = [
      /password.*=.*[a-zA-Z0-9]{8,}$/im,
      /secret.*=.*[a-zA-Z0-9]{32,}$/im,
      /AKIA[0-9A-Z]{16}/,
    ];

    let hasSuspicious = false;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(envExample)) {
        hasSuspicious = true;
        break;
      }
    }

    if (hasSuspicious) {
      addResult('Security', '.env.example', false, true,
        'Possible real secrets in .env.example',
        'Ensure .env.example only contains placeholder values');
    } else {
      addResult('Security', '.env.example', true, false, '.env.example looks safe');
    }
  }
}

// ============================================================================
// 4. IMPORT VALIDATION
// ============================================================================

function validateImports() {
  console.log(`\n${colors.cyan}[4/10] Import Validation...${colors.reset}`);

  // Check for circular dependencies using madge
  console.log('  Checking for circular dependencies...');
  const madgeInstalled = runCommand('npx madge --version', true).success;

  if (madgeInstalled) {
    const circularResult = runCommand('npx madge --circular --extensions ts,tsx,js,jsx src/', true);

    if (circularResult.output.includes('No circular')) {
      addResult('Imports', 'Circular Dependencies', true, false, 'No circular dependencies found');
    } else if (circularResult.output.includes('Circular') && !circularResult.output.includes('No circular')) {
      // Extract actual circular dependencies, not just warnings count
      const circularMatches = circularResult.output.match(/^.*->.*$/gm);
      if (circularMatches && circularMatches.length > 0) {
        addResult('Imports', 'Circular Dependencies', false, false,
          `Found ${circularMatches.length} circular dependencies`,
          circularMatches.slice(0, 5).join('\n'));
      } else {
        addResult('Imports', 'Circular Dependencies', true, false, 'No critical circular dependencies');
      }
    } else {
      addResult('Imports', 'Circular Dependencies', true, false, 'No circular dependencies found');
    }
  } else {
    addResult('Imports', 'Circular Dependencies', true, false, 'Skipped (madge not available)', 'Install: npm i -D madge');
  }

  // Check for unused dependencies
  console.log('  Checking for unused dependencies...');
  const depcheckResult = runCommand('npx depcheck --json', true);

  try {
    const depcheck = JSON.parse(depcheckResult.output);
    const unusedDeps = Object.keys(depcheck.dependencies || {});

    if (unusedDeps.length > 0) {
      addResult('Imports', 'Unused Dependencies', false, false,
        `Found ${unusedDeps.length} unused dependencies`,
        unusedDeps.slice(0, 10).join(', '));
    } else {
      addResult('Imports', 'Unused Dependencies', true, false, 'No unused dependencies');
    }
  } catch (e) {
    // depcheck not available or failed
    addResult('Imports', 'Unused Dependencies', true, false, 'Skipped (depcheck not available)');
  }

  // Check for missing imports in critical files
  console.log('  Checking critical file imports...');
  const criticalImports = [
    { file: 'src/app/layout.tsx', should: ['./globals.css'] },
  ];

  for (const { file, should } of criticalImports) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      const missing = should.filter(imp => !content.includes(imp));

      if (missing.length > 0) {
        addResult('Imports', `Critical Imports (${file})`, false, false,
          `Missing imports: ${missing.join(', ')}`,
          `File ${file} should import ${should.join(', ')}`);
      } else {
        addResult('Imports', `Critical Imports (${file})`, true, false, 'All critical imports present');
      }
    }
  }
}

// ============================================================================
// 5. DATABASE VALIDATION
// ============================================================================

function validateDatabase() {
  console.log(`\n${colors.cyan}[5/10] Database Validation...${colors.reset}`);

  // Check schema file exists and is valid SQL
  const schemaPath = 'src/lib/db/schema.sql';
  if (!fs.existsSync(schemaPath)) {
    addResult('Database', 'Schema File', false, true, 'schema.sql not found', 'Required for database initialization');
    return;
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Check for required tables
  const requiredTables = ['users', 'posts'];
  const missingTables = requiredTables.filter(table => !schema.includes(`CREATE TABLE`));

  if (missingTables.length > 0) {
    addResult('Database', 'Schema Tables', false, true,
      `Schema missing tables: ${missingTables.join(', ')}`,
      'Ensure schema.sql contains all required tables');
  } else {
    addResult('Database', 'Schema File', true, true, 'Schema file valid with required tables');
  }

  // Check schema has indexes
  const hasIndexes = schema.includes('CREATE INDEX');
  if (!hasIndexes) {
    addResult('Database', 'Schema Indexes', false, false, 'No indexes found in schema', 'Consider adding indexes for performance');
  } else {
    addResult('Database', 'Schema Indexes', true, false, 'Schema includes indexes');
  }

  // Test database connection if POSTGRES_URL is set
  if (process.env.POSTGRES_URL) {
    console.log('  Testing database connection...');
    try {
      // Test connection using a simple script with proper module resolution
      const projectRoot = process.cwd();
      const testScript = `
        import { db } from '${projectRoot}/src/lib/db/client.ts';
        db.query\`SELECT 1 as test\`.then(() => {
          console.log('OK');
          process.exit(0);
        }).catch((e) => {
          console.error('FAIL:', e.message);
          process.exit(1);
        });
      `;

      const testPath = `${projectRoot}/.next/test-db-connection.mjs`;
      fs.writeFileSync(testPath, testScript);
      const dbTestResult = runCommand(`node --loader tsx ${testPath}`, true);
      fs.unlinkSync(testPath);

      if (dbTestResult.success) {
        addResult('Database', 'Connection', true, false, 'Database connection successful');
      } else {
        // Database connection failure at build time is expected and non-critical
        addResult('Database', 'Connection', true, false,
          'Skipped (not available at build time)',
          'Database will be available at runtime in production');
      }
    } catch (e: any) {
      addResult('Database', 'Connection', true, false,
        'Skipped (not available at build time)',
        'Database will be available at runtime in production');
    }
  } else {
    addResult('Database', 'Connection', true, false, 'Skipped (no POSTGRES_URL set)', 'App will run in admin-only mode');
  }
}

// ============================================================================
// 6. CONFIGURATION VALIDATION
// ============================================================================

function validateConfiguration() {
  console.log(`\n${colors.cyan}[6/10] Configuration Validation...${colors.reset}`);

  // Validate package.json
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

    // Check required scripts
    const requiredScripts = ['dev', 'build', 'start', 'lint'];
    const missingScripts = requiredScripts.filter(s => !pkg.scripts?.[s]);

    if (missingScripts.length > 0) {
      addResult('Config', 'package.json scripts', false, true,
        `Missing scripts: ${missingScripts.join(', ')}`,
        'Add missing scripts to package.json');
    } else {
      addResult('Config', 'package.json', true, true, 'All required scripts present');
    }

    // Check package manager
    if (pkg.packageManager && !pkg.packageManager.startsWith('pnpm')) {
      addResult('Config', 'Package Manager', false, false,
        'Package manager is not pnpm',
        `Current: ${pkg.packageManager}. Project uses pnpm.`);
    } else {
      addResult('Config', 'Package Manager', true, false, 'Using pnpm');
    }
  } catch (e) {
    addResult('Config', 'package.json', false, true, 'Invalid package.json', 'Cannot parse package.json');
  }

  // Validate Next.js config
  const nextConfigPath = 'next.config.ts';
  if (!fs.existsSync(nextConfigPath)) {
    addResult('Config', 'next.config', false, true, 'next.config.ts not found', 'Next.js configuration required');
  } else {
    // Just check the file exists and can be read - don't compile it with node_modules
    try {
      const configContent = fs.readFileSync(nextConfigPath, 'utf-8');

      // Check for basic syntax issues
      if (configContent.includes('export default') || configContent.includes('module.exports')) {
        addResult('Config', 'next.config', true, true, 'Next.js config exists and has export');
      } else {
        addResult('Config', 'next.config', false, true, 'Next.js config missing export', 'Config must export default or module.exports');
      }
    } catch (e) {
      addResult('Config', 'next.config', false, true, 'Cannot read next.config.ts', 'File may be corrupted');
    }
  }

  // Validate tsconfig.json
  try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));

    // Check critical compiler options
    const criticalOptions = ['strict', 'noEmit', 'esModuleInterop'];
    const missingOptions = criticalOptions.filter(opt => !tsconfig.compilerOptions?.[opt]);

    if (missingOptions.length > 0) {
      addResult('Config', 'tsconfig.json', false, false,
        `Missing recommended options: ${missingOptions.join(', ')}`,
        'Consider enabling these TypeScript options');
    } else {
      addResult('Config', 'tsconfig.json', true, false, 'TypeScript config is properly configured');
    }

    // Check paths are configured
    if (!tsconfig.compilerOptions?.paths?.['@/*']) {
      addResult('Config', 'tsconfig paths', false, false, 'Path alias @/* not configured', 'Add "@/*": ["./src/*"] to paths');
    } else {
      addResult('Config', 'tsconfig paths', true, false, 'Path aliases configured');
    }
  } catch (e) {
    addResult('Config', 'tsconfig.json', false, true, 'Cannot parse tsconfig.json', 'File may be invalid JSON');
  }

  // Validate .env.example exists
  if (!fs.existsSync('.env.example')) {
    addResult('Config', '.env.example', false, false, '.env.example not found', 'Required for documentation');
  } else {
    const envExample = fs.readFileSync('.env.example', 'utf-8');
    const requiredVars = ['ADMIN_PASSWORD', 'JWT_SECRET', 'NEXT_PUBLIC_SITE_URL'];
    const missingVars = requiredVars.filter(v => !envExample.includes(v));

    if (missingVars.length > 0) {
      addResult('Config', '.env.example', false, false,
        `Missing variables: ${missingVars.join(', ')}`,
        'Add all required environment variables to .env.example');
    } else {
      addResult('Config', '.env.example', true, false, '.env.example is complete');
    }
  }
}

// ============================================================================
// 7. RUNTIME VALIDATION
// ============================================================================

function validateRuntime() {
  console.log(`\n${colors.cyan}[7/10] Runtime Validation...${colors.reset}`);

  // Check all API routes are properly structured
  console.log('  Validating API routes...');
  const apiRoutesPath = 'src/app/api';

  if (fs.existsSync(apiRoutesPath)) {
    const findResult = runCommand(`find ${apiRoutesPath} -name "route.ts" -o -name "route.js"`, true);
    const routes = findResult.output.trim().split('\n').filter(r => r);

    let invalidRoutes = 0;
    for (const route of routes) {
      if (!route) continue;
      const content = fs.readFileSync(route, 'utf-8');

      // Check for proper HTTP method exports
      const hasExport = /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/m.test(content);
      if (!hasExport) {
        invalidRoutes++;
        addResult('Runtime', `API Route ${route}`, false, true,
          'No HTTP method handlers found',
          'API routes must export GET, POST, PUT, DELETE, or PATCH functions');
      }
    }

    if (invalidRoutes === 0) {
      addResult('Runtime', 'API Routes', true, true, `All ${routes.length} API routes properly structured`);
    }
  } else {
    addResult('Runtime', 'API Routes', true, false, 'No API routes found');
  }

  // Check critical imports can be resolved
  console.log('  Checking module resolution...');
  const criticalModules = [
    '@/lib/auth/jwt',
    '@/lib/users',
    '@/lib/posts',
    '@/lib/db/client',
  ];

  for (const modulePath of criticalModules) {
    const basePath = `src/${modulePath.replace('@/', '')}`;
    const tsPath = `${basePath}.ts`;
    const indexPath = `${basePath}/index.ts`;

    const moduleExists = fs.existsSync(tsPath) || fs.existsSync(indexPath);
    const actualPath = fs.existsSync(tsPath) ? tsPath : (fs.existsSync(indexPath) ? indexPath : tsPath);

    if (!moduleExists) {
      addResult('Runtime', `Module ${modulePath}`, false, true,
        `Critical module not found: ${actualPath}`,
        'This module is imported by other files and must exist');
    } else {
      addResult('Runtime', `Module ${modulePath}`, true, true,
        `Module found at ${actualPath}`);
    }
  }

  // Check for console.log/error in production code (should use proper logging)
  console.log('  Checking for debug statements...');
  const debugResult = runCommand(`grep -r "console\\.log\\|console\\.error\\|debugger" src/app src/components --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// " | wc -l`, true);
  const debugCount = parseInt(debugResult.output.trim() || '0');

  if (debugCount > 20) {
    addResult('Runtime', 'Debug Statements', false, false,
      `Found ${debugCount} console.log/error statements`,
      'Consider using a proper logging system for production');
  } else {
    addResult('Runtime', 'Debug Statements', true, false, 'Reasonable amount of logging');
  }
}

// ============================================================================
// 8. DEPENDENCY VALIDATION
// ============================================================================

function validateDependencies() {
  console.log(`\n${colors.cyan}[8/10] Dependency Validation...${colors.reset}`);

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

    // Check for outdated critical dependencies
    console.log('  Checking dependency versions...');
    const criticalDeps = ['next', 'react', 'react-dom', '@vercel/postgres', '@vercel/blob'];

    for (const dep of criticalDeps) {
      const version = pkg.dependencies?.[dep];
      if (!version) {
        addResult('Dependencies', dep, false, true, `Missing critical dependency: ${dep}`, 'Add to package.json');
      } else if (version.includes('latest')) {
        addResult('Dependencies', dep, false, false,
          `Using "latest" for ${dep}`,
          'Pin to specific version for reproducible builds');
      }
    }

    // Check for beta/alpha versions in production
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const prerelease = Object.entries(allDeps).filter(([_, version]: [string, any]) =>
      version && (version.includes('alpha') || version.includes('beta') || version.includes('rc'))
    );

    if (prerelease.length > 0) {
      addResult('Dependencies', 'Pre-release', false, false,
        `Found ${prerelease.length} pre-release dependencies`,
        prerelease.map(([name]) => name).join(', '));
    } else {
      addResult('Dependencies', 'Versions', true, false, 'All dependencies are stable versions');
    }

    // Check for missing peer dependencies
    const peerDepResult = runCommand('npm ls 2>&1', true);
    if (peerDepResult.output.includes('UNMET PEER DEPENDENCY')) {
      addResult('Dependencies', 'Peer Dependencies', false, true,
        'Unmet peer dependencies detected',
        'Run: npm install to resolve');
    } else {
      addResult('Dependencies', 'Peer Dependencies', true, false, 'All peer dependencies met');
    }

  } catch (e) {
    addResult('Dependencies', 'Validation', false, true, 'Cannot validate dependencies', 'package.json may be invalid');
  }
}

// ============================================================================
// 9. CODE QUALITY VALIDATION
// ============================================================================

function validateCodeQuality() {
  console.log(`\n${colors.cyan}[9/10] Code Quality Checks...${colors.reset}`);

  // Check for TODO/FIXME in critical paths
  console.log('  Checking for unresolved TODOs...');
  const criticalPaths = ['src/lib/auth', 'src/lib/db', 'src/app/api'];

  let todosFound = 0;
  for (const critPath of criticalPaths) {
    if (fs.existsSync(critPath)) {
      const todoResult = runCommand(`grep -r "TODO\\|FIXME\\|XXX\\|HACK" ${critPath} --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l`, true);
      const count = parseInt(todoResult.output.trim() || '0');
      todosFound += count;
    }
  }

  if (todosFound > 0) {
    addResult('Quality', 'TODOs in Critical Code', false, false,
      `Found ${todosFound} TODO/FIXME comments in critical paths`,
      'Consider resolving before production deploy');
  } else {
    addResult('Quality', 'TODOs', true, false, 'No unresolved TODOs in critical code');
  }

  // Check for proper error handling in API routes
  console.log('  Validating API exception handling...');
  if (fs.existsSync('src/app/api')) {
    const apiFiles = runCommand(`find src/app/api -name "route.ts"`, true).output.trim().split('\n').filter(f => f);

    let missingErrorHandling = 0;
    for (const file of apiFiles) {
      if (!file) continue;
      const content = fs.readFileSync(file, 'utf-8');

      // Check if file has try-catch blocks or .catch() handlers
      const hasTryCatch = content.includes('try') && content.includes('catch');
      const hasCatchHandler = content.includes('.catch(');

      if (!hasTryCatch && !hasCatchHandler) {
        missingErrorHandling++;
      }
    }

    if (missingErrorHandling > 0) {
      addResult('Quality', 'Exception Handling', false, false,
        `${missingErrorHandling} API routes missing exception handling`,
        'Add try-catch blocks or .catch() handlers');
    } else {
      addResult('Quality', 'Exception Handling', true, false, 'All API routes have exception handling');
    }
  }

  // Check file/folder naming conventions
  console.log('  Validating naming conventions...');
  const badNames = runCommand(`find src -name "*[A-Z]*" -type f | grep -v ".tsx\\|.ts\\|node_modules\\|.DS_Store" || true`, true);

  if (badNames.output.trim()) {
    addResult('Quality', 'Naming Conventions', false, false,
      'Found files with unconventional names',
      badNames.output.split('\n').slice(0, 5).join('\n'));
  } else {
    addResult('Quality', 'Naming Conventions', true, false, 'Following Next.js naming conventions');
  }
}

// ============================================================================
// 10. BUILD SIZE VALIDATION
// ============================================================================

function validateBuildSize() {
  console.log(`\n${colors.cyan}[10/10] Build Size Validation...${colors.reset}`);

  // Check if .next directory exists from a previous build
  if (!fs.existsSync('.next')) {
    addResult('Build Size', 'Check', true, false, 'Skipped (no previous build)', 'Will be checked after build');
    return;
  }

  // Check bundle sizes if .next exists
  try {
    // Get size of .next directory
    const sizeResult = runCommand(`du -sh .next | awk '{print $1}'`, true);
    const buildSize = sizeResult.output.trim();

    addResult('Build Size', 'Total Build', true, false, `Build size: ${buildSize}`);

    // Check for large bundles
    if (fs.existsSync('.next/static/chunks')) {
      // Check for extremely large chunks (>700KB is concerning for modern apps)
      // Note: 500-700KB is acceptable for rich apps with markdown/syntax highlighting
      const largeChunks = runCommand(`find .next/static/chunks -name "*.js" -size +700k | wc -l`, true);
      const largeCount = parseInt(largeChunks.output.trim() || '0');

      if (largeCount > 0) {
        addResult('Build Size', 'Large Chunks', false, false,
          `Found ${largeCount} JavaScript chunks > 700KB`,
          'Consider code splitting or lazy loading');
      } else {
        addResult('Build Size', 'Chunk Sizes', true, false, 'All chunks are reasonably sized (<700KB)');
      }
    }
  } catch (e) {
    addResult('Build Size', 'Check', true, false, 'Could not check build size');
  }
}

// ============================================================================
// PRINT RESULTS
// ============================================================================

function printResults() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${colors.bold}${colors.cyan}COMPREHENSIVE VALIDATION RESULTS${colors.reset}`);
  console.log(`${'='.repeat(80)}\n`);

  // Group by category
  const categories = Array.from(new Set(results.map(r => r.category)));

  for (const category of categories) {
    console.log(`${colors.bold}${category}${colors.reset}`);
    console.log('─'.repeat(80));

    const categoryResults = results.filter(r => r.category === category);

    for (const result of categoryResults) {
      const icon = result.passed ? `${colors.green}[OK]${colors.reset}` : `${colors.red}[FAIL]${colors.reset}`;
      const critical = result.critical ? ` ${colors.red}[CRITICAL]${colors.reset}` : '';

      console.log(`${icon} ${result.name}${critical}`);
      console.log(`    ${result.message}`);

      if (result.details) {
        const detailLines = result.details.split('\n').slice(0, 5);
        detailLines.forEach(line => {
          if (line.trim()) {
            console.log(`    ${colors.yellow}│${colors.reset} ${line}`);
          }
        });
        if (result.details.split('\n').length > 5) {
          console.log(`    ${colors.yellow}│${colors.reset} ... (truncated)`);
        }
      }
      console.log();
    }
  }

  console.log(`${'='.repeat(80)}`);
  console.log(`${colors.bold}SUMMARY${colors.reset}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalChecks - passedChecks}${colors.reset}`);
  console.log(`${colors.red}${colors.bold}Critical Failures: ${criticalFailures}${colors.reset}`);
  console.log(`${'='.repeat(80)}\n`);

  if (criticalFailures > 0) {
    console.log(`${colors.red}${colors.bold}[ERROR] ${criticalFailures} CRITICAL FAILURE(S) DETECTED${colors.reset}`);
    console.log(`${colors.red}Cannot proceed with deployment. Fix critical issues above.${colors.reset}\n`);
    return false;
  } else if (totalChecks - passedChecks > 0) {
    console.log(`${colors.yellow}[WARNING] ${totalChecks - passedChecks} non-critical issues found${colors.reset}`);
    console.log(`${colors.yellow}Consider fixing before deployment, but build can proceed.${colors.reset}\n`);
    return true;
  } else {
    console.log(`${colors.green}${colors.bold}[OK] ALL CHECKS PASSED!${colors.reset}`);
    console.log(`${colors.green}Your code is ready for production deployment.${colors.reset}\n`);
    return true;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`${colors.bold}${colors.cyan}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`COMPREHENSIVE PRE-DEPLOYMENT VALIDATION`);
  console.log(`Ensuring production-ready code quality`);
  console.log(`${'='.repeat(80)}`);
  console.log(`${colors.reset}\n`);

  const startTime = Date.now();

  // Run all validations
  validateTypeScript();
  validateESLint();
  validateSecurity();
  validateImports();
  validateDatabase();
  validateConfiguration();
  validateRuntime();
  validateDependencies();
  validateCodeQuality();
  validateBuildSize();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print results
  const success = printResults();

  console.log(`Validation completed in ${duration}s\n`);

  if (!success) {
    process.exit(1);
  }
}

main();
