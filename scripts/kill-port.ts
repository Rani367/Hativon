#!/usr/bin/env tsx

/**
 * Kill process running on a specific port
 * Cross-platform script for development
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PORT = process.argv[2] || '3000';

async function killPort(port: string): Promise<void> {
  const platform = process.platform;

  try {
    if (platform === 'win32') {
      // Windows
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      const lines = stdout.trim().split('\n');

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          try {
            await execAsync(`taskkill /PID ${pid} /F`);
            console.log(`[OK] Killed process ${pid} on port ${port}`);
          } catch (err) {
            // Process might already be dead
          }
        }
      }
    } else {
      // Unix-like (macOS, Linux)
      try {
        const { stdout } = await execAsync(`lsof -ti:${port}`);
        const pids = stdout.trim().split('\n').filter(Boolean);

        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            console.log(`[OK] Killed process ${pid} on port ${port}`);
          } catch (err) {
            // Process might already be dead
          }
        }
      } catch (err) {
        // No process found on port - this is fine
        console.log(`[INFO] No process found on port ${port}`);
      }
    }
  } catch (error) {
    // Silently ignore errors - port might already be free
    console.log(`[INFO] Port ${port} is available`);
  }
}

killPort(PORT)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('[ERROR] Failed to kill port:', err);
    process.exit(1);
  });
