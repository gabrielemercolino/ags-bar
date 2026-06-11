import * as time from "./time/widget"
import * as title from "./title/widget"

export type Descriptor = { parseCss: (raw: any) => Record<string, string> }
export type WidgetName = keyof typeof registry
type WidgetCfg = { [K in keyof typeof registry]: Parameters<typeof registry[K]["factory"]>[0] }
type Item = { factory: (cfg: any) => any, descriptor: Descriptor }

export const registry = {
  time: { factory: time.Widget, descriptor: time.descriptor },
  title: { factory: title.Widget, descriptor: title.descriptor },
} satisfies Record<string, Item>

export function buildWidget<K extends WidgetName>(name: K, widgetCfg: WidgetCfg[K]) {
  const { factory } = registry[name]
  const Factory = factory as (cfg: any) => ReturnType<typeof factory>
  return Factory(widgetCfg)
}
