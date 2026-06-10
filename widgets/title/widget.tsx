import { createBinding, With } from "ags"
import AstalHyprland from "gi://AstalHyprland"
import { Descriptor } from "../descriptor"

const hyprland = AstalHyprland.get_default()

type TitleConfig = {
  variant: "title" | "initialTitle"
}

export function Widget({ variant }: TitleConfig) {
  const focusedClient = createBinding(hyprland, "focusedClient")
  const hasClient = focusedClient.as(fc => !!fc)

  return (
    <box
      visible={hasClient}
      cssName="title"
    >
      <With value={focusedClient}>
        {
          (fc) => {
            if (!fc) return <label />
            const text = createBinding(fc, variant)
            return <label label={text} />
          }
        }
      </With>
    </box>
  )
}

export const descriptor: Descriptor<TitleConfig> = {
  parseParams: (raw) => ({
    variant: raw.variant
  }),
  parseCss: (raw) => ({
    "--title-bg": raw.bg,
    "--title-fg": raw.fg
  }),
}
