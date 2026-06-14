import { Gtk } from "ags/gtk4"

import * as time from "./time/widget"
import * as title from "./title/widget"

export type Descriptor<T> = {
  parseCss: (cfg: T) => { vars: Record<string, string>; css: string }
}
export type WidgetName = keyof typeof registry
export type WidgetCfg = { [K in keyof typeof registry]: Parameters<typeof registry[K]["factory"]>[0] }
type Item<T> = { factory: (cfg: T) => Gtk.Widget, descriptor: Descriptor<T> }

export const registry = {
  time: { factory: time.Widget, descriptor: time.descriptor },
  title: { factory: title.Widget, descriptor: title.descriptor },
} satisfies Record<string, Item<any>>

export function buildWidget<K extends WidgetName>(name: K, widgetCfg: WidgetCfg[K]) {
  const { factory } = registry[name]
  const Factory = factory as (cfg: any) => ReturnType<typeof factory>
  return Factory(widgetCfg)
}
