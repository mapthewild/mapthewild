import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';

const OWN_HOSTS = ['mapthewild.github.io', 'mapthewild.xyz', 'www.mapthewild.xyz'];

/**
 * Rehype plugin: links to other sites open in a new tab and say so,
 * so readers don't lose their place in a post.
 */
export function externalLinks() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'a') return;
      const href = String(node.properties?.href ?? '');
      if (!/^https?:\/\//.test(href)) return;

      try {
        if (OWN_HOSTS.includes(new URL(href).hostname)) return;
      } catch {
        return;
      }

      node.properties = {
        ...node.properties,
        target: '_blank',
        rel: ['noopener', 'noreferrer'],
      };
      node.children.push(
        {
          type: 'element',
          tagName: 'span',
          properties: { className: ['external-link-mark'], ariaHidden: 'true' },
          children: [{ type: 'text', value: ' ↗' }],
        },
        {
          type: 'element',
          tagName: 'span',
          properties: { className: ['sr-only'] },
          children: [{ type: 'text', value: ' (opens in a new tab)' }],
        }
      );
    });
  };
}
