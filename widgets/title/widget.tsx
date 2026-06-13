import { createBinding, With } from "ags"
import AstalHyprland from "gi://AstalHyprland"
import { Descriptor } from "../registry"
import { Gtk } from "ags/gtk4"

const hyprland = AstalHyprland.get_default()

type TitleConfig = {
  variant: "title" | "initialTitle",

  // css
  bg: string,
  fg: string
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
  ) as Gtk.Widget
}

export const descriptor = {
  parseCss: (cfg) => ({
    "--title-bg": cfg.bg,
    "--title-fg": cfg.fg
  }),
} satisfies Descriptor<TitleConfig>
