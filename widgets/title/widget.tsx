import { createBinding, createComputed } from "ags"
import AstalHyprland from "gi://AstalHyprland"
import type { Widget } from "../registry"
import { Gtk } from "ags/gtk4"
import styles from "./styles.scss"

const hyprland = AstalHyprland.get_default()

type TitleConfig = {
  variant: "title" | "initialTitle",

  // css
  bg: string,
  fg: string
}

export const widget = { render, css } satisfies Widget<TitleConfig>

function css(cfg: TitleConfig) {
  return {
    vars: {
      "--title-bg": cfg.bg,
      "--title-fg": cfg.fg
    },
    css: styles
  }
}

function render({ variant }: TitleConfig) {
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
