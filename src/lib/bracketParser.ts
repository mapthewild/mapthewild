import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

/**
 * Bracket Parser - Remark plugin for [[trigger:content]] syntax
 *
 * Supports:
 * - Claude artifacts: [[word:artifactId]] → data-type="artifact"
 * - External websites: [[word:https://url]] → data-type="site"
 * - Explicit type: [[word:site:https://url]] or [[word:artifact:id]]
 */

interface ParsedBracket {
  trigger: string;
  type: 'artifact' | 'site';
  content: string;
}

/**
 * Escape HTML special characters to prevent XSS attacks.
 * Applied to user-controlled content before inserting into HTML strings.
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char])
}

function parseBracketContent(trigger: string, content: string): ParsedBracket {
  // Check for explicit type declaration: [[word:type:content]]
  const explicitTypeMatch = content.match(/^(artifact|site):(.+)$/);
  if (explicitTypeMatch) {
    return {
      trigger,
      type: explicitTypeMatch[1] as 'artifact' | 'site',
      content: explicitTypeMatch[2],
    };
  }

  // Check if content is a URL
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return {
      trigger,
      type: 'site',
      content,
    };
  }

  // Default to Claude artifact
  return {
    trigger,
    type: 'artifact',
    content,
  };
}

export function bracketParser() {
  return function (tree: Root) {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null || typeof index === 'undefined') return;

      const text = node.value;
      // Regex: [[trigger:content]] where trigger can have spaces, content can have colons (for URLs)
      // Match: [[ + (anything except ] and :) + : + (anything except ]) + ]]
      const bracketRegex = /\[\[([^\]:]+):([^\]]+)\]\]/g;

      if (!bracketRegex.test(text)) return;

      const newNodes: Array<{ type: string; value: string }> = [];
      let lastIndex = 0;

      bracketRegex.lastIndex = 0;
      let match;

      while ((match = bracketRegex.exec(text)) !== null) {
        const [fullMatch, rawTrigger, rawContent] = match;
        const matchStart = match.index;

        if (matchStart > lastIndex) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex, matchStart),
          });
        }

        const parsed = parseBracketContent(rawTrigger.trim(), rawContent.trim());

        newNodes.push({
          type: 'html',
          value: `<span class="bracket-link" data-trigger="${escapeHtml(parsed.trigger)}" data-type="${parsed.type}" data-content="${encodeURIComponent(parsed.content)}" role="button" tabindex="0">${escapeHtml(parsed.trigger)}</span>`,
        });

        lastIndex = matchStart + fullMatch.length;
      }

      if (lastIndex < text.length) {
        newNodes.push({
          type: 'text',
          value: text.slice(lastIndex),
        });
      }

      if (newNodes.length > 0) {
        parent.children.splice(index, 1, ...newNodes);
      }
    });
  };
}
