import Hyprland from "gi://AstalHyprland"
import { createBinding, With } from "ags"

const hyprland = Hyprland.get_default()

export default function Title() {
  const focusedClient = createBinding(hyprland, "focusedClient")

  return (
    <With value={focusedClient}>
      {(fc) => {
        if (!fc) return <box cssName="title" visible={false} />

        const initialTitle = createBinding(fc, "initialTitle")
        return (
          <box
            cssName="title"
            visible={initialTitle.as((it) => it !== null && it.length > 0)}
          >
            <label label={initialTitle.as((it) => it ?? "")} />
          </box>
        )
      }}
    </With>
  )
}
