# Automata Studio

Automata Studio is a static, interactive learning tool for Theory of Computation. Enter a regular expression and inspect each mathematically correct representation produced on the client: a Thompson NFA, a DFA built by subset construction, and a minimized DFA.

> Transform abstract automata theory into an interactive, visual learning experience.

## Features

- Real-time, human-readable regex validation.
- Implicit concatenation support (`ab`) and optional explicit concatenation (`a.b`).
- Regex parsing pipeline: explicit concatenation, postfix notation, and a strongly typed AST.
- Thompson's Construction with visible epsilon (`ε`) transitions.
- Epsilon closure and subset construction with deterministic, stable DFA identifiers.
- DFA minimization that removes unreachable states and merges equivalent states.
- Interactive left-to-right Cytoscape/Dagre diagrams with a start arrow, pan, zoom, fit, re-layout, and click-to-inspect states.
- A pipeline rail (regex → ε-NFA → DFA → minimal DFA) that doubles as the graph switcher.
- String simulator on every graph: on the NFA it tracks the whole set of active states; on DFAs it follows the single path. The current state is highlighted on the graph and in the table.
- Transition tables, and a "How it's built" panel with the parse tree, ε-closures, subset mapping, and every partition-refinement pass of minimization.
- Light ("drafting paper") and dark ("blueprint") themes.
- PNG graph export and JSON automaton export.
- Responsive, keyboard-accessible UI with visible focus states.

## Technology

- React 19, TypeScript (strict mode), Vite, and Tailwind CSS
- Cytoscape.js with the Dagre layout extension
- Vitest for unit and pipeline tests
- ESLint and Prettier

No backend is used. Parsing, construction, minimization, simulation, and export all run in the browser, so the generated `dist/` folder can be hosted on Vercel, Netlify, GitHub Pages, or any static web server.

## Architecture

```text
src/
├── engine/                 Mathematical core (no React dependencies)
│   ├── validation/         Regex validation
│   ├── parser/             Concat insertion, postfix conversion, AST
│   ├── nfa/                Thompson construction and ε-closure
│   ├── dfa/                Subset construction and DFA utilities
│   ├── minimization/       DFA minimization
│   └── pipeline.ts         Regex → NFA → DFA → minimized DFA
├── adapters/               Automata → Cytoscape elements
├── components/             UI, graph, tables, inspector, exports
├── hooks/                  React state and conversion orchestration
└── utils/                  Export and presentation helpers
```

The UI consumes the single `convertRegexToAutomata` pipeline and never implements automata algorithms itself.

## Supported syntax

| Form                         | Meaning             |
| ---------------------------- | ------------------- |
| `a`, `b`, `0`, `1`, `_`, `-` | Literal symbol      |
| `a\|b`                       | Union               |
| `ab` or `a.b`                | Concatenation       |
| `a*`                         | Kleene star         |
| `(a\|b)*`                    | Parenthesized group |

Expressions use single-character literals. Whitespace inside an expression is not supported.

## Algorithms at a glance

1. **Validation and parsing**: syntax is validated, implied concatenation is made explicit, the Shunting-yard algorithm produces postfix notation, and postfix is converted to a discriminated-union AST.
2. **Thompson's Construction**: every AST node produces an NFA fragment with one entry and one exit; union and star use epsilon transitions to connect fragments.
3. **Subset Construction**: each DFA state represents an epsilon-closed set of NFA states. A state is accepting when its set contains an NFA accepting state.
4. **DFA minimization**: unreachable states are discarded and indistinguishable accepting/non-accepting partitions are refined and merged.

## Getting started

Prerequisites: Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

### Commands

```bash
npm run dev       # start the development server
npm run test      # execute Vitest tests once
npm run lint      # lint source and test files
npm run build     # type-check and create a production build
npm run preview   # serve the production build locally
```

## Testing

The test suite covers parser precedence and malformed expressions, NFA fragments and epsilon closure, DFA generation and determinism, minimization and language equivalence, adapters, exports, and full-pipeline conversion.

The required example expressions are included in integration coverage:

```text
a
ab
a|b
a*
(a|b)*
ab*
a(b|c)
(a|b)c
(a|b)*abb
((a|b)*abb)
```

## Deployment

Run `npm run build` and deploy the generated `dist/` directory. Because the app has no server-side routes or backend dependencies, standard static-host deployment settings work without additional configuration.

## Screenshots

_Add product screenshots or a short demo GIF here._

## Future improvements

- Step-by-step animated algorithm traces.
- Multi-character escaped literals and richer regex syntax.
- Editable automata and equivalence comparison.
- Import/export of additional interchange formats.
- More formal proofs and in-app exercises.
