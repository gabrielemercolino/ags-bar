import { createBinding, With } from "ags"
import AstalHyprland from "gi://AstalHyprland"
import { Descriptor } from "../registry"
import { Gtk } from "ags/gtk4"
import styles from "./styles.scss"

const hyprland = AstalHyprland.get_default()

type TitleConfig = {
  variant: "title" | "initialTitle",

  // css
  bg: string,
  fg: string
}

export function Widget({ variant }: TitleConfig) {
  const focusedClient = createBinding(hyprland, "focusedClient")

  return (
    <With value={focusedClient}>
      {(fc) => {
        if (!fc) return <box cssName="title" visible={false} />

        const text = createBinding(fc, variant)
        return (
          <box
            cssName="title"
            visible={text.as((t) => t !== null && t.length > 0)}
          >
            <label label={text.as((t) => t ?? "")} />
          </box>
        )
      }}
    </With>
  ) as Gtk.Widget
}

export const descriptor = {
  parseCss: (cfg) => ({
    vars: {
      "--title-bg": cfg.bg,
      "--title-fg": cfg.fg
    },
    css: styles
  }),
} satisfies Descriptor<TitleConfig>
