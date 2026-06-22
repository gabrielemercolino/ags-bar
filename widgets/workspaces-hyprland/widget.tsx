import { createBinding, For } from "ags"
import { Gtk } from "ags/gtk4"
import AstalHyprland from "gi://AstalHyprland"
import { Descriptor } from "../registry"
import Button from "../../components/Button"
import styles from "./styles.scss"

const hyprland = AstalHyprland.get_default()

type WorkspacesConfig = {
  // css
  bg: string,
  fg: string,
  active: { bg: string, fg: string }
}

export function Widget({ }: WorkspacesConfig) {
  const workspaces = createBinding(hyprland, "workspaces")
    .as(wss => wss.toSorted((a, b) => a.id - b.id))
  const focusedWorkspace = createBinding(hyprland, "focusedWorkspace")

  return (
    <box cssName="workspaces">
      <For each={workspaces}>
        {(workspace) => (
          <Button
            cssName="workspace"
            class={focusedWorkspace.as(focused => focused.id === workspace.id ? "active" : "")}
            onClicked={() => hyprland.dispatch("", `hl.dsp.focus({workspace = ${workspace.name}})`)}
          >
            {workspace.name}
          </Button>
        )}
      </For>
    </box>
  ) as Gtk.Widget
}

export const descriptor = {
  parseCss: (cfg) => ({
    vars: {
      "--workspaces-bg": cfg.bg,
      "--workspaces-fg": cfg.fg,
      "--workspaces-active-bg": cfg.active.bg,
      "--workspaces-active-fg": cfg.active.fg
    },
    css: styles
  }),
} satisfies Descriptor<WorkspacesConfig>
