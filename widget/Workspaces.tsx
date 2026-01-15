import { createBinding, For } from "ags"
import AstalHyprland from "gi://AstalHyprland?version=0.1"
import Button from "../components/Button"

const hyprland = AstalHyprland.get_default()

function getWorkspaceIds(
  workspaces: AstalHyprland.Workspace[]
): number[] {
  const maxId = Math.max(...workspaces.map((ws) => ws.id))
  return Array.from({ length: maxId }, (_, i) => i + 1)
}

function getWorkspaceClasses(id: number, focusedId: number): string {
  const classes = ["workspace"]
  if (focusedId === id) classes.push("active")
  return classes.join(" ")
}

export default function Workspaces() {
  const workspaces = createBinding(hyprland, "workspaces")
  const focusedWorkspace = createBinding(hyprland, "focusedWorkspace")

  const workspaceIds = workspaces.as((wss) => {
    const sorted = wss.sort((a, b) => a.id - b.id).filter((ws) => ws.id > 0)

    return getWorkspaceIds(sorted)
  })

  return (
    <box class="workspaces">
      <For each={workspaceIds}>
        {(id) => (
          <Button
            class={focusedWorkspace.as((focused) =>
              getWorkspaceClasses(id, focused.id),
            )}
            onClicked={() => hyprland.dispatch("workspace", id.toString())}
          >
            {id}
          </Button>
        )}
      </For>
    </box>
  )
}
