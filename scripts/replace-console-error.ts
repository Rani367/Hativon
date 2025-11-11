/**
 * Replace console.error with logError from logger
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

async function replaceConsoleError() {
  // Find all TypeScript/TSX files in src/app and src/components
  const files = await glob('src/{app,components}/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**'],
  });

  console.log(`[INFO] Found ${files.length} files to process`);

  let filesModified = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    const originalContent = content;

    // Check if file contains console.error
    if (!content.includes('console.error')) {
      continue;
    }

    // Replace console.error with logError
    content = content.replace(/console\.error/g, 'logError');

    // Check if import already exists
    const hasImport = content.includes("from '@/lib/logger'") || content.includes('from "@/lib/logger"');

    if (!hasImport) {
      // Find the last import statement
      const lines = content.split('\n');
      let lastImportIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
          lastImportIndex = i;
        }
        // Stop after imports section (when we hit first non-import, non-empty, non-comment line)
        if (lastImportIndex !== -1 && i > lastImportIndex + 3) {
          if (lines[i].trim() && !lines[i].trim().startsWith('import') && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*')) {
            break;
          }
        }
      }

      if (lastImportIndex !== -1) {
        // Add import after last import
        lines.splice(lastImportIndex + 1, 0, "import { logError } from '@/lib/logger';");
        content = lines.join('\n');
      } else {
        // No imports found, add at the beginning after any directives
        const firstLineIndex = content.indexOf('\n') + 1;
        content = content.slice(0, firstLineIndex) + "import { logError } from '@/lib/logger';\n" + content.slice(firstLineIndex);
      }
    }

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(file, content);
      filesModified++;
      console.log(`[OK] Modified: ${file}`);
    }
  }

  console.log(`\n[INFO] Modified ${filesModified} file(s)`);
}

replaceConsoleError().catch((error) => {
  console.error('[ERROR] Script failed:', error);
  process.exit(1);
});
