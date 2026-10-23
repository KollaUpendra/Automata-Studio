/**
 * StepBreakdown — how the expression became each machine:
 * pipeline overview, parsing (postfix + AST), subset construction and minimization rounds.
 */

import { useMemo, useState } from 'react';
import type { ConversionResult, ConversionSuccess } from '../../engine/pipeline';
import type { RegexNode } from '../../engine/parser/ast';
import { epsilonClosure } from '../../engine/nfa/epsilonClosure';

type Section = 'overview' | 'parse' | 'subsets' | 'minimize';

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'parse', label: 'Parsing' },
  { id: 'subsets', label: 'Subset construction' },
  { id: 'minimize', label: 'Minimization' },
];

export function StepBreakdown({ result }: { result: ConversionResult | null }) {
  const [section, setSection] = useState<Section>('overview');

  if (!result || !result.success) {
    return (
      <div className="panel__empty">Build an expression to see how each machine is derived.</div>
    );
  }

  return (
    <div className="panel">
      <div className="subtabs" role="group" aria-label="Topic">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={section === s.id}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {section === 'overview' && <Overview result={result} />}
      {section === 'parse' && <Parsing result={result} />}
      {section === 'subsets' && <Subsets result={result} />}
      {section === 'minimize' && <Minimization result={result} />}
    </div>
  );
}

function Overview({ result }: { result: ConversionSuccess }) {
  return (
    <ol className="timeline">
      {result.steps.map((step) => (
        <li key={step.name}>
          <div className="timeline__name">{step.name}</div>
          <div className="timeline__detail">{step.detail}</div>
        </li>
      ))}
    </ol>
  );
}

// ─── Parsing ────────────────────────────────────────────────────────────────

interface TreeLine {
  prefix: string;
  kind: 'op' | 'lit';
  text: string;
}

function treeLines(node: RegexNode, prefix = '', isLast = true, isRoot = true): TreeLine[] {
  const branch = isRoot ? '' : isLast ? '└─ ' : '├─ ';
  const childPrefix = isRoot ? '' : prefix + (isLast ? '   ' : '│  ');
  const here = prefix + branch;
  switch (node.type) {
    case 'literal':
      return [{ prefix: here, kind: 'lit', text: `'${node.value}'` }];
    case 'star':
      return [
        { prefix: here, kind: 'op', text: 'star  *' },
        ...treeLines(node.child, childPrefix, true, false),
      ];
    case 'concat':
    case 'union':
      return [
        { prefix: here, kind: 'op', text: node.type === 'concat' ? 'concat  ·' : 'union  |' },
        ...treeLines(node.left, childPrefix, false, false),
        ...treeLines(node.right, childPrefix, true, false),
      ];
  }
}

function Parsing({ result }: { result: ConversionSuccess }) {
  const lines = useMemo(() => treeLines(result.ast), [result.ast]);
  return (
    <>
      <p className="panel__intro">
        Concatenation is made explicit with “.”, the shunting-yard algorithm reorders the expression
        into postfix, and the postfix is folded into a syntax tree. Thompson’s construction then
        builds one small NFA per tree node.
      </p>
      <div className="form-row">
        <span className="form-row__k">As typed</span>
        <span className="form-row__v">{result.regex}</span>
      </div>
      <div className="form-row">
        <span className="form-row__k">Explicit concatenation</span>
        <span className="form-row__v">{result.withConcat}</span>
      </div>
      <div className="form-row">
        <span className="form-row__k">Postfix</span>
        <span className="form-row__v">{result.postfix}</span>
      </div>
      <h3 className="h3" style={{ marginTop: '1.25rem' }}>
        Syntax tree
      </h3>
      <pre className="ast" aria-label="Abstract syntax tree">
        {lines.map((l, i) => (
          <div key={i}>
            <span className="branch">{l.prefix}</span>
            <span className={l.kind}>{l.text}</span>
          </div>
        ))}
      </pre>
    </>
  );
}

// ─── Subset construction ────────────────────────────────────────────────────

const fmt = (ids: Iterable<number>) =>
  `{${[...ids]
    .sort((a, b) => a - b)
    .map((id) => `s${id}`)
    .join(', ')}}`;

function Subsets({ result }: { result: ConversionSuccess }) {
  const { nfa, dfa } = result;
  const closures = useMemo(
    () => nfa.states.map((s) => ({ id: s.id, closure: epsilonClosure(new Set([s.id]), nfa) })),
    [nfa],
  );

  return (
    <>
      <p className="panel__intro">
        Every DFA state stands for the set of NFA states the NFA could be in at the same moment. It
        starts from ε-closure(s{nfa.startState}) and is accepting when the set contains an NFA
        accepting state.
      </p>

      <h3 className="h3">DFA states as NFA state sets</h3>
      <table className="kv">
        <thead>
          <tr>
            <th scope="col">DFA state</th>
            <th scope="col">NFA states</th>
          </tr>
        </thead>
        <tbody>
          {dfa.states.map((s) => (
            <tr key={s.id}>
              <td>
                {s.id}
                {s.isStart && (
                  <span className="tag tag--start" style={{ marginLeft: 6 }}>
                    start
                  </span>
                )}
                {s.isAccepting && (
                  <span className="tag tag--accept" style={{ marginLeft: 6 }}>
                    accept
                  </span>
                )}
              </td>
              <td>{fmt(s.nfaStates)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="h3">ε-closure of each NFA state</h3>
      <table className="kv">
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">Reachable by ε-moves alone</th>
          </tr>
        </thead>
        <tbody>
          {closures.map(({ id, closure }) => (
            <tr key={id}>
              <td>s{id}</td>
              <td>{fmt(closure)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

// ─── Minimization ───────────────────────────────────────────────────────────

function Minimization({ result }: { result: ConversionSuccess }) {
  const { dfa, minimizedDfa, minimization } = result;
  const merged = dfa.states.length - minimizedDfa.states.length;
  const accepting = new Set(dfa.acceptStates);

  return (
    <>
      <p className="panel__intro">
        States are first split into accepting and non-accepting groups. Each pass then splits any
        group whose members send some symbol into different groups. When a pass changes nothing,
        each remaining group becomes one state of the minimal DFA.
      </p>
      <p className="summary-line">
        <strong>
          {dfa.states.length} → {minimizedDfa.states.length} states
        </strong>
        {merged > 0
          ? `: ${merged} redundant state${merged === 1 ? '' : 's'} merged.`
          : ': the DFA was already minimal.'}
        {minimization.unreachable.length > 0 &&
          ` Removed unreachable: ${minimization.unreachable.join(', ')}.`}
      </p>

      <ol className="rounds">
        {minimization.rounds.map((round, i) => (
          <li key={i}>
            <div className="round__label">
              {i === 0 ? 'Start: accepting vs. non-accepting' : `Pass ${i}`}, {round.length} group
              {round.length === 1 ? '' : 's'}
            </div>
            <div className="blocks">
              {round.map((group) => (
                <span
                  key={group.join()}
                  className={`block ${accepting.has(group[0]) ? 'block--accept' : ''}`}
                >
                  {`{${group.join(', ')}}`}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <h3 className="h3">Minimal DFA states</h3>
      <table className="kv">
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">Merges these DFA states</th>
          </tr>
        </thead>
        <tbody>
          {minimizedDfa.states.map((s) => (
            <tr key={s.id}>
              <td>
                {s.id}
                {s.isStart && (
                  <span className="tag tag--start" style={{ marginLeft: 6 }}>
                    start
                  </span>
                )}
                {s.isAccepting && (
                  <span className="tag tag--accept" style={{ marginLeft: 6 }}>
                    accept
                  </span>
                )}
              </td>
              <td>{`{${(minimization.classes.get(s.id) ?? []).join(', ')}}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
