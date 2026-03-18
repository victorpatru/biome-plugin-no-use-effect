# biome-plugin-no-use-effect

A Biome linter plugin that disallows direct `useEffect` calls in React code, encouraging safer patterns like derived state, event handlers, data-fetching libraries, and `useMountEffect`.

Inspired by [Why we banned React's useEffect](https://x.com/alvinsng/status/2033969062834045089).

## Installation

```bash
npm install --save-dev biome-plugin-no-use-effect
```

or with your preferred package manager:

```bash
yarn add -D biome-plugin-no-use-effect
pnpm add -D biome-plugin-no-use-effect
bun add -D biome-plugin-no-use-effect
```

## Usage

Add the plugin to your Biome configuration file (`biome.json` or `biome.jsonc`):

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "plugins": ["node_modules/biome-plugin-no-use-effect/no-use-effect.grit"]
}
```

The plugin will now report an error whenever `useEffect` is called directly.

### Suppressing the rule

For the `useMountEffect` wrapper — the one legitimate place `useEffect` belongs — suppress it inline:

```typescript
function useMountEffect(effect: () => void | (() => void)) {
  // biome-ignore lint/plugin/no-use-effect: useMountEffect implementation
  useEffect(effect, []);
}
```

## What it catches

Any direct call to `useEffect`:

```typescript
// ❌ Error
useEffect(() => {
  fetchData();
}, [id]);

// ❌ Error
useEffect(() => {
  setFilteredItems(items.filter((i) => i.active));
}, [items]);
```

## Replacement patterns

Instead of reaching for `useEffect`, prefer:

**1. Derive state inline** — no effect needed for computed values

```typescript
// ✅
const filteredItems = items.filter((i) => i.active);
```

**2. Data-fetching libraries** — React Query, SWR, etc. handle caching/cancellation

```typescript
// ✅
const { data } = useQuery(['item', id], () => fetchItem(id));
```

**3. Event handlers** — if it happens because of a user action, put it in the handler

```typescript
// ✅
<button onClick={() => postLike()}>Like</button>
```

**4. useMountEffect** — for genuine one-time external sync (DOM, third-party widgets)

```typescript
// ✅
function useMountEffect(effect: () => void | (() => void)) {
  // biome-ignore lint/plugin/no-use-effect: useMountEffect implementation
  useEffect(effect, []);
}

function VideoPlayer() {
  useMountEffect(() => player.play());
}
```

**5. key prop reset** — use React's remount semantics instead of dependency choreography

```typescript
// ✅
function VideoPlayerWrapper({ videoId }) {
  return <VideoPlayer key={videoId} videoId={videoId} />;
}
```

## Why avoid direct useEffect?

- **Dependency arrays hide coupling** — unrelated refactors silently change effect behavior
- **Infinite loop hazards** — `state update → render → effect → state update` cycles are easy to create and hard to debug
- **Effect chains** — `A sets state that triggers B` is implicit time-based control flow
- **Race conditions** — effect-based fetching has no built-in cancellation or deduplication
- **Harder to onboard** — "why did this run?" has no clear answer without tracing dependency arrays

See the React team's own guide: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect).

## Enforce with AI agents

When AI agents (Cursor, Claude Code, etc.) write React code, `useEffect` is one of the most commonly added hooks — often "just in case." There are two complementary ways to make agents respect this rule.

### Hooks

Wire the linter into your agent's post-edit hook so violations are caught and auto-fixed before the agent considers a task done.

**Cursor** — add to `.cursor/hooks.json`:

```jsonc
{
  "afterEdit": ["npx @biomejs/biome check --write ${file}"]
}
```

**Claude Code** — add to `.claude/settings.json`:

```jsonc
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npx @biomejs/biome check --write $CLAUDE_TOOL_OUTPUT_PATH"
          }
        ]
      }
    ]
  }
}
```

### AGENTS.md

Document the rule in your `AGENTS.md` so agents understand the intent *before* writing code, not just after. This is the highest-leverage integration — it shifts enforcement left, from lint-time correction to generation-time avoidance.

```markdown
## Linting rules

- Never call `useEffect` directly. Use `useMountEffect()` for mount-only side effects.
  Alternatives: derived state, data-fetching libraries (React Query / SWR),
  event handlers, and key-based remount.
- The one exception is inside the `useMountEffect` implementation itself,
  which must be suppressed with `// biome-ignore lint/plugin/no-use-effect: useMountEffect implementation`.
```

## Contributing

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/biome-plugin-no-use-effect.git
cd biome-plugin-no-use-effect
npm install
```

### Testing

```bash
npm test
```

Tests are in `test/plugin.test.ts` using Vitest. Fixtures live in `test/fixtures/`.

### Publishing

1. Update the version in `package.json`
2. `npm publish`
3. Tag the release on GitHub

## License

MIT
