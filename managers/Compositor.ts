import { createState, type Accessor } from "ags"
import AstalWorkspace from "gi://AstalWorkspace"

export type Workspace = AstalWorkspace.Workspace

const WorkspaceState = AstalWorkspace.WorkspaceState

export class Compositor {
  readonly workspaces: Accessor<Workspace[]>
  readonly focusedTitle: Accessor<string>

  private manager = AstalWorkspace.get_default() as AstalWorkspace.WorkspaceManager<Workspace>

  constructor() {
    const [workspaces, setWorkspaces] = createState<Workspace[]>(this.snapshot())
    this.workspaces = workspaces

    // Eagerly connected instead of using a lazy AGS binding: the compositor
    // emits its first `updated` asynchronously right after startup, before the
    // widget would have subscribed, which left the list empty until a switch.
    this.manager.connect("updated", () => setWorkspaces(this.snapshot()))

    // Cross-compositor window title lands with the AstalToplevel lib (last step).
    const [focusedTitle] = createState("")
    this.focusedTitle = focusedTitle
  }

  activate(workspace: Workspace) {
    workspace.activate()
  }

  isActive(workspace: Workspace) {
    return (workspace.state & WorkspaceState.ACTIVE) !== 0
  }

  // The `workspaces` GObject property is a GPtrArray, which GJS cannot marshal,
  // so read the ListModel API instead and refresh on the manager's `updated` signal.
  private snapshot(): Workspace[] {
    const items: Workspace[] = []
    const n = this.manager.get_n_items()
    for (let i = 0; i < n; i++) {
      const w = this.manager.get_item(i)
      if (w) items.push(w as Workspace)
    }
    return items
  }
}

export const compositor = new Compositor()
