import { describe, expect, it } from 'vitest';
import { getVoyageState } from './voyageGraph';

describe('Reading-page wayfinding', () => {
  it('keeps all six destinations on pages without a territory', () => {
    for (const path of ['/mapthewild/posts/', '/mapthewild/islands/', '/mapthewild/about/']) {
      const state = getVoyageState(path, []);
      expect(state.nodes.map(node => node.label)).toEqual([
        'Home', 'Nowbrary', 'Map', 'Sunday Ritual', 'Life in 5', 'Soulfield Oasis', 'Future Dads Club',
      ]);
      expect(state.activeIsland).toBeUndefined();
    }
  });

  it('does not mistake an unassigned post for the external Life in 5 stop', () => {
    const post = { slug: 'unassigned', data: { title: 'A post', date: new Date('2026-01-01') } };
    const state = getVoyageState('/mapthewild/posts/unassigned/', [post]);
    expect(state.currentNode.label).toBe('A post');
    expect(state.currentNode.href).toBe('/mapthewild/posts/unassigned');
  });
});
