import { createBinding, createComputed } from "ags"
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
  const text = createComputed(() => {
    const fc = focusedClient()
    if (!fc) return ""
    return createBinding(fc, variant)() ?? ""
  })

  return (
    <label
      cssName="title"
      visible={text.as(t => t.length > 0)}
      label={text}
    />
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
