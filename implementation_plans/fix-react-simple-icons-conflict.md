# Fix `@icons-pack/react-simple-icons` Peer Dependency Conflict

## Context
- Deployments fail because `@icons-pack/react-simple-icons@13.8.0` declares a peer requirement of `react@"^16.13 || ^17 || ^18 || ^19"` while the project uses the React 19 canary build (`19.0.0-rc-45804af1-20241021`). Pre-release versions do not satisfy the peer constraint, so `npm install` aborts during Vercel builds.
- A ripgrep search shows no imports of `react-simple-icons`, suggesting the package is unused.
- Package manager is `pnpm@9.12.3`, so edits must include `pnpm-lock.yaml`.

## Proposed Steps
1. **Reconfirm Usage**  
   Run `rg "simple-icons" -n` (already done) to ensure there are no references to `@icons-pack/react-simple-icons`. If any show up, plan will be revised before removal.
2. **Remove the Dependency**  
   Delete the `@icons-pack/react-simple-icons` entry from `dependencies` in `package.json`.
3. **Refresh the Lockfile**  
   Execute `pnpm install` to regenerate `pnpm-lock.yaml` without the package, ensuring no lingering references remain.
4. **Sanity Checks**  
   - Run `pnpm lint` (Ultracite check) to ensure no type or lint regressions from the dependency change.  
   - Optionally run `pnpm build` locally, or rely on Vercel to confirm `npm install` now succeeds.

## Risks & Mitigations
- *Risk:* The icon library might be required for future features.  
  *Mitigation:* Document the removal in commit/message; it can be re-added later once React 19 support lands or when the app downgrades React.
- *Risk:* Lockfile drift if `pnpm install` introduces other updates.  
  *Mitigation:* Use the existing lockfile, only commit the minimal diff produced by removing the dependency.

## Rollback Plan
Re-add `"@icons-pack/react-simple-icons": "^13.8.0"` to `package.json`, rerun `pnpm install`, and restore the previous lockfile version (or checkout from git) if the package becomes necessary again.

