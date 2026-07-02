import { Gtk } from "ags/gtk4"

import { widget as time } from "./time/widget"
import { widget as title } from "./title/widget"
import { widget as system } from "./system/widget"
import { widget as battery } from "./battery/widget"
import { widget as workspacesHyprland } from "./workspaces-hyprland/widget"
import { widget as audio } from "./audio/widget"
import { widget as connections } from "./connections/widget"

export type Widget<T> = {
  render: (cfg: T) => Gtk.Widget
  css: (cfg: T) => { vars: Record<string, string>; css: string }
}
export type WidgetName = keyof typeof registry
export type WidgetCfg = { [K in WidgetName]: Parameters<(typeof registry)[K]["render"]>[0] }

export const registry = {
  time,
  title,
  system,
  battery,
  "workspaces/hyprland": workspacesHyprland,
  audio,
  connections,
} as const

export function buildWidget<K extends WidgetName>(name: K, cfg: WidgetCfg[K]) {
  return registry[name].render(cfg as any)
}
