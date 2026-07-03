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

`Widget<T>` is defined in `widgets/registry.ts`:

```ts
export type Widget<T> = {
  render: (cfg: T) => Gtk.Widget
  css: (cfg: T) => { vars: Record<string, string>; css: string }
}
```

Each widget lives in `widgets/<name>/widget.tsx` with this file structure:

```
1. imports
2. widget config type
3. export const widget = { render, css } satisfies Widget<MyConfig>
4. function css(cfg: MyConfig) { ... }
5. function render(cfg: MyConfig) { ... }
6. everything else
```

The `render` and `css` functions should not be inlined,
they should preferably be standalone functions referenced by the `widget` object.

Widgets are registered in `widgets/registry.ts`:
```ts
import { widget as myName } from "./my-name/widget"
// then added to the registry const object
```

### Coding style

Most types should be inferred.
When something needs to match a specific type, prefer `satisfies` over a type annotation.
Use `as` assertions only when necessary to satisfy TypeScript and when you're certain the assertion is safe
