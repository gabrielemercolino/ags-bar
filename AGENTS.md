## ags-bar

A Gtk4 bar built with AGS + TypeScript/JSX.

> IMPORTANT
> Before making any changes, check `git status` to ensure the working tree is clean (no uncommitted modifications).
> If there are changes, ask the user for confirmation before proceeding

### Testing

After making changes, test by running:
```sh
ags run entry.ts defaults.toml
```
If the bar fails to start or the previous instance is still running, run `pkill gjs` and try again.
If it still doesn't work, report the issue and stop

### Key files

| File | Purpose |
|---|---|
| `entry.ts` | App entry |
| `Bar.tsx` | Bar layout |
| `BarContext.ts` | Monitor context |
| `managers/ConfigManager.ts` | Config loading & watching (merges `defaults.toml` + user config) |
| `managers/CssManager.ts` | CSS application |
| `widgets/registry.ts` | Widget registry (all available widgets registered here) |
| `defaults.toml` | Default configs |
| `components/` | Reusable UI components |

### Widget system

Each widget lives in `widgets/<name>/widget.tsx` and MUST export:
- `Widget(cfg) → Gtk.Widget` — the factory function
- `descriptor` — object that satisfies `Descriptor<T>` where `T` is the `cfg` type

### Coding style

Most types should be inferred.
When something needs to match a specific type, prefer `satisfies` over a type annotation.
Use `as` assertions only when necessary to satisfy TypeScript and when you're certain the assertion is safe
