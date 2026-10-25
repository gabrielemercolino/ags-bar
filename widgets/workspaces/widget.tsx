import { createBinding, For } from "ags"
import { Gtk } from "ags/gtk4"
import type { Widget } from "../registry"
import Button from "../../components/Button"
import styles from "./styles.scss"
import { compositor, type Workspace } from "../../managers/Compositor"

type WorkspacesConfig = {
  // css
  bg: string,
  fg: string,
  active: { bg: string, fg: string }
}

export const widget = { render, css } satisfies Widget<WorkspacesConfig>

function css(cfg: WorkspacesConfig) {
  return {
    vars: {
      "--workspaces-bg": cfg.bg,
      "--workspaces-fg": cfg.fg,
      "--workspaces-active-bg": cfg.active.bg,
      "--workspaces-active-fg": cfg.active.fg
    },
    css: styles
  }
}

function render({ }: WorkspacesConfig) {
  return (
    <box cssName="workspaces">
      <For each={compositor.workspaces}>
        {(workspace: Workspace) => (
          <Button
            cssName="workspace"
            class={createBinding(workspace, "state").as(() => compositor.isActive(workspace) ? "active" : "")}
            onLeftClick={() => compositor.activate(workspace)}
          >
            <label label={createBinding(workspace, "name")} />
          </Button>
        )}
      </For>
    </box>
  ) as Gtk.Widget
}
