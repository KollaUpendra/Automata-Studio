import { describe, expect, it } from 'vitest';
import {
  dfaToCytoscapeElements,
  nfaToCytoscapeElements,
  type CytoscapeNode,
} from '../../src/adapters/cytoscapeAdapter';
import type { DFA } from '../../src/engine/dfa/types';
import { convertRegexToAutomata } from '../../src/engine/pipeline';

describe('Cytoscape adapter', () => {
  it('represents all NFA states and labels epsilon transitions', () => {
    const result = convertRegexToAutomata('a|b');
    expect(result.success).toBe(true);
    if (!result.success) return;

    const elements = nfaToCytoscapeElements(result.nfa);
    const nodes = elements.filter(
      (element): element is CytoscapeNode => !('source' in element.data),
    );
    const edges = elements.filter((element) => 'source' in element.data);

    expect(nodes).toHaveLength(result.nfa.states.length);
    expect(nodes.some((node) => node.data.isStart)).toBe(true);
    expect(nodes.some((node) => node.data.isAccepting)).toBe(true);
    expect(edges.some((edge) => edge.data.label.includes('ε'))).toBe(true);
  });

  it('combines parallel DFA edge labels and preserves state metadata', () => {
    const dfa: DFA = {
      states: [
        { id: 'q0', nfaStates: new Set([0]), isStart: true, isAccepting: false },
        { id: 'q1', nfaStates: new Set([1]), isStart: false, isAccepting: true },
      ],
      transitions: [
        { from: 'q0', to: 'q1', symbol: 'a' },
        { from: 'q0', to: 'q1', symbol: 'b' },
      ],
      startState: 'q0',
      acceptStates: new Set(['q1']),
      alphabet: new Set(['a', 'b']),
    };

    const elements = dfaToCytoscapeElements(dfa);
    const nodes = elements.filter(
      (element): element is CytoscapeNode => !('source' in element.data),
    );
    const edges = elements.filter((element) => 'source' in element.data);

    expect(nodes).toHaveLength(dfa.states.length);
    expect(nodes.find((node) => node.data.id === dfa.startState)?.data.isStart).toBe(true);
    expect(edges.some((edge) => edge.data.label === 'a, b')).toBe(true);
  });
});
