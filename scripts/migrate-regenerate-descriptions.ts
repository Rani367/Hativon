/**
 * Migration script to regenerate post descriptions with longer length (300 chars)
 *
 * This script:
 * 1. Creates a backup of all current descriptions
 * 2. Regenerates descriptions from post content using the new 300 char limit
 * 3. Can be rolled back to restore original descriptions
 *
 * Usage:
 *   pnpm tsx scripts/migrate-regenerate-descriptions.ts          # Dry run (preview changes)
 *   pnpm tsx scripts/migrate-regenerate-descriptions.ts --run    # Apply changes
 *   pnpm tsx scripts/migrate-regenerate-descriptions.ts --rollback  # Restore backup
 */

import { db } from '../src/lib/db/client';
import { generateDescription } from '../src/lib/posts/utils';
import * as fs from 'fs';
import * as path from 'path';

interface PostRecord {
  id: string;
  title: string;
  content: string;
  description: string;
}

interface BackupRecord {
  id: string;
  original_description: string;
}

const BACKUP_FILE = path.join(__dirname, 'description-backup.json');

async function getAllPosts(): Promise<PostRecord[]> {
  const result = await db.query`
    SELECT id, title, content, description FROM posts ORDER BY created_at DESC
  `;
  return result.rows as PostRecord[];
}

async function createBackup(posts: PostRecord[]): Promise<void> {
  const backup: BackupRecord[] = posts.map(post => ({
    id: post.id,
    original_description: post.description,
  }));

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`[BACKUP] Created backup of ${backup.length} descriptions at ${BACKUP_FILE}`);
}

function loadBackup(): BackupRecord[] | null {
  if (!fs.existsSync(BACKUP_FILE)) {
    return null;
  }

  const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
  return JSON.parse(content) as BackupRecord[];
}

async function updateDescription(postId: string, newDescription: string): Promise<void> {
  await db.query([
    'UPDATE posts SET description = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    newDescription,
    postId,
  ]);
}

async function dryRun(): Promise<void> {
  console.log('\n[DRY RUN] Previewing changes (no database modifications)\n');
  console.log('='.repeat(80));

  const posts = await getAllPosts();
  let changedCount = 0;

  for (const post of posts) {
    const newDescription = generateDescription(post.content);

    if (newDescription !== post.description) {
      changedCount++;
      console.log(`\n[POST] ${post.title.substring(0, 50)}...`);
      console.log(`  ID: ${post.id}`);
      console.log(`  OLD (${post.description.length} chars): "${post.description.substring(0, 80)}..."`);
      console.log(`  NEW (${newDescription.length} chars): "${newDescription.substring(0, 80)}..."`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n[SUMMARY]`);
  console.log(`  Total posts: ${posts.length}`);
  console.log(`  Will be updated: ${changedCount}`);
  console.log(`  No change needed: ${posts.length - changedCount}`);
  console.log(`\nTo apply these changes, run:`);
  console.log(`  pnpm tsx scripts/migrate-regenerate-descriptions.ts --run\n`);
}

async function applyMigration(): Promise<void> {
  console.log('\n[MIGRATION] Applying description regeneration...\n');

  const posts = await getAllPosts();

  // Create backup first
  console.log('[STEP 1/3] Creating backup...');
  await createBackup(posts);

  // Regenerate descriptions
  console.log('[STEP 2/3] Regenerating descriptions...');
  let updatedCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    const newDescription = generateDescription(post.content);

    if (newDescription !== post.description) {
      await updateDescription(post.id, newDescription);
      updatedCount++;
      console.log(`  [OK] Updated: ${post.title.substring(0, 50)}...`);
    } else {
      skippedCount++;
    }
  }

  // Verify changes
  console.log('[STEP 3/3] Verifying changes...');
  const updatedPosts = await getAllPosts();
  const verifyFailed: string[] = [];

  for (const post of updatedPosts) {
    const expectedDescription = generateDescription(post.content);
    if (post.description !== expectedDescription) {
      verifyFailed.push(post.id);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n[MIGRATION COMPLETE]`);
  console.log(`  Total posts: ${posts.length}`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped (no change): ${skippedCount}`);
  console.log(`  Verification failures: ${verifyFailed.length}`);

  if (verifyFailed.length > 0) {
    console.log(`\n[WARNING] Some posts failed verification: ${verifyFailed.join(', ')}`);
  }

  console.log(`\nBackup saved to: ${BACKUP_FILE}`);
  console.log(`To rollback, run:`);
  console.log(`  pnpm tsx scripts/migrate-regenerate-descriptions.ts --rollback\n`);
}

async function rollback(): Promise<void> {
  console.log('\n[ROLLBACK] Restoring original descriptions...\n');

  const backup = loadBackup();

  if (!backup) {
    console.error('[ERROR] No backup file found at', BACKUP_FILE);
    console.error('Cannot rollback without a backup.');
    process.exit(1);
  }

  console.log(`[INFO] Found backup with ${backup.length} records`);

  let restoredCount = 0;
  let errorCount = 0;

  for (const record of backup) {
    try {
      await updateDescription(record.id, record.original_description);
      restoredCount++;
    } catch (error) {
      console.error(`  [ERROR] Failed to restore post ${record.id}:`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n[ROLLBACK COMPLETE]`);
  console.log(`  Total records: ${backup.length}`);
  console.log(`  Restored: ${restoredCount}`);
  console.log(`  Errors: ${errorCount}`);

  if (errorCount === 0) {
    console.log(`\nRollback successful. You can delete the backup file if no longer needed.`);
  } else {
    console.log(`\n[WARNING] Some posts failed to restore. Check errors above.`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  console.log('='.repeat(80));
  console.log('POST DESCRIPTION REGENERATION MIGRATION');
  console.log('='.repeat(80));

  try {
    if (args.includes('--rollback')) {
      await rollback();
    } else if (args.includes('--run')) {
      await applyMigration();
    } else {
      await dryRun();
    }
  } catch (error) {
    console.error('\n[FATAL ERROR]', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
