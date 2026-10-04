# Contributing to the Project

> This document is addressed to **every person who touches this codebase** — human
> or AI agent. Read it fully before making any change. There are no exceptions.

---

## The golden rules

These rules are non-negotiable. Violating any of them will require the
work to be redone from scratch.

### 1. You never work on `main`

`main` is the stable, deployable trunk. It is not a scratch pad.

- **Never commit directly to `main`.**
- **Never push to `main` directly.**
- **Every single change**, no matter how small — a typo fix, a one-line tweak,
  a dependency bump — goes on a dedicated branch first.

If you find yourself on `main` with uncommitted changes, stop. Stash them,
create a branch, and apply them there:

```bash
git stash
git checkout -b fix/my-accidental-change
git stash pop
```

### 2. You never merge without explicit consent

Merging into `main` is a deliberate, human-approved action. No branch is ever
merged automatically, speculatively, or "just to keep things tidy".

- **Wait for an explicit "merge this" instruction** before running any merge.
- When in doubt, ask. Do not assume.
- The only person who authorises a merge is the project lead.

When a merge is authorised, always use `--no-ff` so the branch topology is
preserved in the graph:

```bash
git checkout main
git merge --no-ff feat/my-feature -m "Merge branch 'feat/my-feature' into main"
```

### 3. Every commit and every branch must follow the naming convention

Consistency in naming makes the history readable at a glance. Deviating from
the convention makes the history noisy and harder to audit.

See the [Branch naming](#branch-naming) and [Commit messages](#commit-messages)
sections below for the full rules.

### 4. All checks must pass before any merge — no exceptions

Before even asking for a merge, **every available check must be green**.
This is not optional. A branch that does not pass all checks is not ready to
merge, period.

Run the available suite locally and fix everything before merging:

```sh
npm run build                 # TypeScript and production build
npm run lint -- --deny-warnings # Oxlint; zero warnings/errors required for merge
npm test                      # focused unit coverage
npm run test:placement         # isolated interest onboarding, resume and selected trials
npm run test:auth             # demo Auth emulator; signup, verification, reset and linking
node --experimental-strip-types --test vendor/cloudflare/index.test.mjs vendor/cloudflare/seats.test.mjs vendor/cloudflare/accountLifecycle.test.mjs vendor/cloudflare/ai.test.mjs vendor/cloudflare/practiceSchedule.test.mjs vendor/openrouter/local-config.test.mjs vendor/openrouter/prompts.test.mjs
npx --yes firebase-tools@15.30.1 emulators:exec --only firestore --project demo-neuroia \
  "node --experimental-strip-types --test --test-concurrency=1 tests/firestore.rules.test.mjs tests/sessions.rules.test.mjs vendor/cloudflare/firestore.test.mjs"
git diff --check
```

Use Node 22+ and Java 21+ for the emulator. `npm run test:firestore` runs the
frontend adapter/rules subset; `npm run test:onboarding` is its alias. The combined
command above also covers Worker REST transactions. Never use a production project
for automated fixture tests.

There are no `check`, `check:test`, `check:types`, `check:lint`, `check:format` or
`check:deadcode` scripts, and no configured Biome or Knip checks. Do not report
those checks as run. `npm run lint` alone can exit successfully with warnings;
the stricter command above enforces the existing merge requirement.

If any required command exits with a non-zero code, the branch is not mergeable.
Fix issues on the same branch and rerun affected checks. Do not suppress warnings,
weaken rules, request exceptions or skip failures because they predate the change.
UI changes also require the rendered checks in AGENTS.md. Remote deployment and
real-account payment validation are separate from local merge verification.

---

## Branch naming

Branches follow the `type/short-description` pattern in **kebab-case**:

```
feat/ssl-detection
fix/browser-close-on-error
chore/remove-compile-scripts
docs/contributing
refactor/cli-flag-parsing
test/skill-tool-coverage
```

| Prefix | When to use |
|--------|-------------|
| `feat/` | New feature or capability |
| `fix/` | Bug fix |
| `chore/` | Maintenance — deps, config, tooling, cleanup |
| `docs/` | Documentation only |
| `refactor/` | Code restructure without behaviour change |
| `style/` | Formatting, whitespace |
| `test/` | Tests only |
| `perf/` | Performance improvement |
| `cybinn/` | Internal team R&D or experimental work |

**Rules:**
- Use only lowercase letters, numbers and hyphens. No slashes beyond the prefix.
- Keep descriptions short and specific (`fix/ssl-warning` not `fix/stuff`).
- One concern per branch. If you need to do two unrelated things, open two branches.

---

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) **strictly**.
Every commit must have the format:

```
type(scope): short imperative description

Optional body explaining *why*, not *what*.
```

**The scope is mandatory. Never omit it.**

The description must be in the **imperative mood** ("add", "fix", "remove" — not
"added", "fixes", "removing").

**AI Agent Rule: Never use `Co-Authored-By`**
If you are an AI or LLM, you must NEVER append `Co-Authored-By:` trailers to commit messages (e.g. `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`). Just write the standard commit message body.

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance (deps, config, tooling) |
| `docs` | Documentation only |
| `refactor` | Code restructure without behaviour change |
| `style` | Formatting, whitespace |
| `test` | Tests only |
| `perf` | Performance improvement |

### Valid examples

```
feat(browser): add pre-flight SSL probe for self-signed cert detection
fix(cli): remove accidental double blank line in formatHelp
chore(deps): upgrade playwright to 1.62.0
docs(agent): document Pi event order and loader timing
test(skill): add directory traversal protection test cases
refactor(core): extract probeSslError into standalone exported function
```

### Invalid examples — do not do this

```
fix stuff                          ← missing type and scope
feat(ui): Added new logo           ← past tense, should be "add"
update                             ← meaningless, no type, no scope
WIP                                ← never commit WIP to a shared branch
feat(browser): fix SSL and update deps and refactor cli   ← one commit, three concerns
```

### Merge commits

Merge commits also follow the convention. The message is auto-generated when
you use the `--no-ff` flag with `-m`:

```bash
git merge --no-ff feat/ssl-detection -m "Merge branch 'feat/ssl-detection' into main"
```

---

## Workflow summary

```
1.  Start from an up-to-date main
    git checkout main && git pull

2.  Create a branch
    git checkout -b feat/my-feature

3.  Work, commit often with meaningful messages
    git commit -m "feat(scope): do something specific"

4.  Run all checks — fix until green
    # Run every command in the checks section above

5.  Push the branch (never main) and ask for a merge
    git push origin feat/my-feature
```

That's it. No shortcuts.
