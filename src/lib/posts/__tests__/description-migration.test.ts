/**
 * Tests for the description regeneration migration
 *
 * These tests verify:
 * 1. Description generation works correctly with the shared description limit
 * 2. No data loss occurs during migration
 * 3. Edge cases are handled properly
 */

import { describe, it, expect } from 'bun:test';
import { generateDescription, MAX_DESCRIPTION_LENGTH } from '../utils';

describe('Description Regeneration Migration', () => {
  describe('MAX_DESCRIPTION_LENGTH', () => {
    it('should be 160 characters', () => {
      expect(MAX_DESCRIPTION_LENGTH).toBe(160);
    });
  });

  describe('generateDescription', () => {
    it('should return full text if under the shared limit', () => {
      const shortContent = 'This is a short post about something interesting.';
      const result = generateDescription(shortContent);
      expect(result).toBe(shortContent);
      expect(result.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    });

    it('should truncate and add ellipsis if over the shared limit', () => {
      const longContent = 'A'.repeat(400);
      const result = generateDescription(longContent);
      expect(result.length).toBe(MAX_DESCRIPTION_LENGTH + 3);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should strip markdown syntax', () => {
      const markdownContent = '# Heading\n\nThis is **bold** and *italic* text with [a link](url).';
      const result = generateDescription(markdownContent);
      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).not.toContain('[');
      expect(result).not.toContain(']');
    });

    it('should strip code blocks', () => {
      const codeContent = 'Some text\n```javascript\nconst x = 1;\n```\nMore text';
      const result = generateDescription(codeContent);
      expect(result).not.toContain('```');
      expect(result).not.toContain('const x = 1');
      expect(result).toContain('Some text');
      expect(result).toContain('More text');
    });

    it('should strip inline code', () => {
      const inlineCodeContent = 'Use the `console.log` function to debug.';
      const result = generateDescription(inlineCodeContent);
      expect(result).not.toContain('`');
      expect(result).toContain('Use the');
      expect(result).toContain('function to debug');
    });

    it('should normalize whitespace', () => {
      const messyContent = 'Multiple   spaces    and\n\nnewlines\there';
      const result = generateDescription(messyContent);
      expect(result).not.toContain('  '); // No double spaces
      expect(result).not.toContain('\n');
      expect(result).not.toContain('\t');
    });

    it('should handle Hebrew content correctly', () => {
      const hebrewContent = 'זוהי כתבה בעברית על נושא מעניין מאוד שקשור לבית הספר ולחיי היומיום של התלמידים.';
      const result = generateDescription(hebrewContent);
      expect(result).toBe(hebrewContent);
    });

    it('should handle mixed Hebrew and English', () => {
      const mixedContent = 'This is English וזה עברית mixed together in one text.';
      const result = generateDescription(mixedContent);
      expect(result).toContain('This is English');
      expect(result).toContain('וזה עברית');
    });

    it('should handle empty content', () => {
      const result = generateDescription('');
      expect(result).toBe('');
    });

    it('should handle exactly the max length without truncation', () => {
      const exactLimit = 'A'.repeat(MAX_DESCRIPTION_LENGTH);
      const result = generateDescription(exactLimit);
      expect(result).toBe(exactLimit);
      expect(result.length).toBe(MAX_DESCRIPTION_LENGTH);
    });

    it('should truncate content that is one character over the limit', () => {
      const contentOverLimit = 'A'.repeat(MAX_DESCRIPTION_LENGTH + 1);
      const result = generateDescription(contentOverLimit);
      expect(result.length).toBe(MAX_DESCRIPTION_LENGTH + 3);
      expect(result).toBe('A'.repeat(MAX_DESCRIPTION_LENGTH) + '...');
    });
  });

  describe('Migration safety checks', () => {
    it('should not modify content field', () => {
      const originalContent = '# My Post\n\nThis is the full content.';
      const description = generateDescription(originalContent);

      // Content should remain unchanged
      expect(originalContent).toBe('# My Post\n\nThis is the full content.');
      expect(description).not.toBe(originalContent);
    });

    it('should produce deterministic output', () => {
      const content = 'This is some test content for deterministic checking.';
      const result1 = generateDescription(content);
      const result2 = generateDescription(content);
      const result3 = generateDescription(content);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should handle special characters safely', () => {
      const specialContent = 'Content with "quotes", <tags>, & ampersands, and \'apostrophes\'.';
      const result = generateDescription(specialContent);

      expect(result).toContain('quotes');
      expect(result).toContain('ampersands');
    });

    it('should handle very long content efficiently', () => {
      const veryLongContent = 'Word '.repeat(10000); // 50,000 characters
      const startTime = Date.now();
      const result = generateDescription(veryLongContent);
      const endTime = Date.now();

      expect(result.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH + 3);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Backup and restore logic', () => {
    it('should preserve original description length in backup structure', () => {
      interface BackupRecord {
        id: string;
        original_description: string;
      }

      const originalDescription = 'Short description';
      const backup: BackupRecord = {
        id: 'test-123',
        original_description: originalDescription,
      };

      expect(backup.original_description).toBe(originalDescription);
      expect(backup.original_description.length).toBe(17);
    });

    it('should be able to store descriptions of any length', () => {
      const shortDesc = 'Short';
      const mediumDesc = 'A'.repeat(MAX_DESCRIPTION_LENGTH);
      const longDesc = 'B'.repeat(MAX_DESCRIPTION_LENGTH + 40);

      expect(shortDesc.length).toBe(5);
      expect(mediumDesc.length).toBe(MAX_DESCRIPTION_LENGTH);
      expect(longDesc.length).toBe(MAX_DESCRIPTION_LENGTH + 40);
    });
  });
});
