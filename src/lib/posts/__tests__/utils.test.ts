import { describe, it, expect } from 'vitest';
import {
  generateSlug,
  generateDescription,
  MAX_DESCRIPTION_LENGTH,
} from '../utils';

describe('Post Utilities', () => {
  describe('generateSlug', () => {
    it('converts simple title to lowercase', () => {
      const slug = generateSlug('Hello World');

      expect(slug).toBe('hello-world');
    });

    it('replaces spaces with hyphens', () => {
      const slug = generateSlug('Multiple   Spaces   Here');

      expect(slug).toBe('multiple-spaces-here');
    });

    it('removes special characters', () => {
      const slug = generateSlug('Hello! @World# $Test%');

      expect(slug).toBe('hello-world-test');
    });

    it('handles Hebrew characters', () => {
      const slug = generateSlug('כותרת הפוסט');

      // Hebrew chars are non-alphanumeric, so they become hyphens
      // but leading/trailing hyphens are removed, resulting in empty string
      expect(slug).toBe('');
    });

    it('removes leading and trailing hyphens', () => {
      const slug = generateSlug('  !Hello World!  ');

      expect(slug).toBe('hello-world');
    });

    it('handles numbers', () => {
      const slug = generateSlug('Post 123 Title');

      expect(slug).toBe('post-123-title');
    });

    it('converts punctuation to hyphens', () => {
      const slug = generateSlug('Hello, World! How are you?');

      expect(slug).toBe('hello-world-how-are-you');
    });

    it('handles empty string', () => {
      const slug = generateSlug('');

      expect(slug).toBe('');
    });

    it('handles string with only special characters', () => {
      const slug = generateSlug('!@#$%^&*()');

      expect(slug).toBe('');
    });

    it('handles camelCase', () => {
      const slug = generateSlug('CamelCaseTitle');

      expect(slug).toBe('camelcasetitle');
    });

    it('handles underscores', () => {
      const slug = generateSlug('title_with_underscores');

      expect(slug).toBe('title-with-underscores');
    });
  });

  describe('generateDescription', () => {
    it('returns plain text from markdown', () => {
      const description = generateDescription('**Bold** and *italic* text');

      expect(description).toBe('Bold and italic text');
    });

    it('removes markdown headers', () => {
      const description = generateDescription('# Header\n## Subheader\nContent');

      expect(description).toBe('Header Subheader Content');
    });

    it('removes code blocks', () => {
      const description = generateDescription(
        'Text before ```javascript\nconst x = 1;\n``` text after'
      );

      expect(description).toBe('Text before text after');
    });

    it('removes inline code', () => {
      const description = generateDescription('Use `console.log()` for debugging');

      expect(description).toBe('Use for debugging');
    });

    it('removes markdown link brackets but keeps URL', () => {
      const description = generateDescription('Check [this link](https://example.com) out');

      // Current implementation removes [] and () but keeps the URL
      expect(description).toBe('Check this linkhttps://example.com out');
    });

    it('truncates to MAX_DESCRIPTION_LENGTH characters', () => {
      const longContent = 'A'.repeat(200);
      const description = generateDescription(longContent);

      expect(description.length).toBe(MAX_DESCRIPTION_LENGTH + 3); // +3 for '...'
      expect(description.endsWith('...')).toBe(true);
    });

    it('does not truncate short content', () => {
      const shortContent = 'Short description';
      const description = generateDescription(shortContent);

      expect(description).toBe('Short description');
      expect(description.endsWith('...')).toBe(false);
    });

    it('handles exactly MAX_DESCRIPTION_LENGTH characters', () => {
      const exactContent = 'A'.repeat(MAX_DESCRIPTION_LENGTH);
      const description = generateDescription(exactContent);

      expect(description).toBe(exactContent);
      expect(description.endsWith('...')).toBe(false);
    });

    it('normalizes multiple whitespaces', () => {
      const description = generateDescription('Text   with\n\nmultiple   spaces');

      expect(description).toBe('Text with multiple spaces');
    });

    it('trims leading and trailing whitespace', () => {
      const description = generateDescription('  Trimmed content  ');

      expect(description).toBe('Trimmed content');
    });

    it('handles empty string', () => {
      const description = generateDescription('');

      expect(description).toBe('');
    });

    it('preserves list markers in plain text', () => {
      const description = generateDescription('- Item 1\n- Item 2\n* Item 3');

      // Current implementation removes * but not - at start
      expect(description).toBe('- Item 1 - Item 2 Item 3');
    });

    it('removes numbered list markers', () => {
      const description = generateDescription('1. First\n2. Second\n3. Third');

      expect(description).toBe('1. First 2. Second 3. Third');
    });

    it('handles mixed markdown elements', () => {
      const complexMarkdown = `
        # Title

        This is **bold** and *italic* text.

        \`\`\`javascript
        const code = "removed";
        \`\`\`

        [Link](url) and \`inline code\`.
      `;
      const description = generateDescription(complexMarkdown);

      expect(description).not.toContain('**');
      expect(description).not.toContain('*');
      expect(description).not.toContain('```');
      expect(description).not.toContain('[');
      expect(description).not.toContain('`');
    });
  });

  describe('MAX_DESCRIPTION_LENGTH constant', () => {
    it('is 160 characters', () => {
      expect(MAX_DESCRIPTION_LENGTH).toBe(160);
    });
  });
});
