import { createBinding, createComputed, createState, type Accessor } from "ags"
import AstalToplevel from "gi://AstalToplevel"
import AstalWorkspace from "gi://AstalWorkspace"

export type Workspace = AstalWorkspace.Workspace

const WorkspaceState = AstalWorkspace.WorkspaceState

export class Compositor {
  readonly workspaces: Accessor<Workspace[]>
  readonly focusedTitle: Accessor<string>
  readonly focusedInitialTitle: Accessor<string>

  private workspaceManager = AstalWorkspace.get_default() as AstalWorkspace.WorkspaceManager<AstalWorkspace.Workspace>
  private toplevelManager = AstalToplevel.get_default()

  constructor() {
    // Eagerly connected instead of lazy AGS bindings: the compositor emits its
    // first `updated` asynchronously right after startup, before the widget
    // would have subscribed, which left the lists empty until a switch.
    const [workspaces, setWorkspaces] = createState<Workspace[]>(this.workspaceSnapshot())
    this.workspaces = workspaces
    this.workspaceManager.connect("updated", () => setWorkspaces(this.workspaceSnapshot()))

    const focused = createBinding(this.toplevelManager, "focused")

    this.focusedTitle = createComputed(() => {
      const toplevel = focused()
      return toplevel ? createBinding(toplevel, "live_title")() : ""
    })

    this.focusedInitialTitle = createComputed(() => {
      const toplevel = focused()
      return toplevel ? createBinding(toplevel, "display_title")() : ""
    })
  }

  activate(workspace: Workspace) {
    workspace.activate()
  }

  isActive(workspace: Workspace) {
    return (workspace.state & WorkspaceState.ACTIVE) !== 0
  }

  // The `workspaces` GObject property is a GPtrArray, which GJS cannot
  // marshal ("Can't convert untyped array to JS value"), so read the
  // ListModel API instead.
  private workspaceSnapshot(): Workspace[] {
    const items: Workspace[] = []
    const n = this.workspaceManager.get_n_items()
    for (let i = 0; i < n; i++) {
      const w = this.workspaceManager.get_item(i)
      if (w) items.push(w)
    }
    return items
  }
}

export const compositor = new Compositor()
