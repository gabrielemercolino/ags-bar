import Hyprland from "gi://AstalHyprland"
import { createBinding, For } from "ags"

const hyprland = Hyprland.get_default()

function getWorkspaceIds(
  workspaces: Hyprland.Workspace[],
  minWorkspaces: number,
): number[] {
  const maxId = Math.max(minWorkspaces, ...workspaces.map((ws) => ws.id))
  return Array.from({ length: maxId }, (_, i) => i + 1)
}

function getWorkspaceClasses(id: number, focusedId: number): string {
  const classes = ["workspace"]
  if (focusedId === id) classes.push("active")
  return classes.join(" ")
}

export default function Workspaces({ minWorkspaces = 3 }) {
  const workspaces = createBinding(hyprland, "workspaces")
  const focusedWorkspace = createBinding(hyprland, "focusedWorkspace")

  const workspaceIds = workspaces.as((wss) => {
    const sorted = wss.sort((a, b) => a.id - b.id).filter((ws) => ws.id > 0)

    return getWorkspaceIds(sorted, minWorkspaces)
  })

  return (
    <box class="workspaces">
      <For each={workspaceIds}>
        {(id) => (
          <button
            class={focusedWorkspace.as((focused) =>
              getWorkspaceClasses(id, focused.id),
            )}
            onClicked={() => hyprland.dispatch("workspace", id.toString())}
          >
            {id}
          </button>
        )}
      </For>
    </box>
  )
}
