import { createComputed } from "ags"
import type { Widget } from "../registry"
import { Gtk } from "ags/gtk4"
import styles from "./styles.scss"
import { compositor } from "../../managers/Compositor"

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

function render({ }: TitleConfig) {
  // `variant` (title vs initialTitle) is honored once the cross-compositor
  // title source (AstalToplevel) is wired into Compositor.focusedTitle.
  const text = createComputed(() => compositor.focusedTitle())

  return (
    <label
      cssName="title"
      visible={text.as(t => t.length > 0)}
      label={text}
    />
  ) as Gtk.Widget
}
