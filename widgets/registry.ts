import { Descriptor } from "./descriptor"
import GObject from "ags/gobject"

import * as time from "./time/widget"

type WidgetEntry<T> = {
  factory: (cfg: T) => GObject.Object
  descriptor: Descriptor<T>
}

export const registry: Record<string, WidgetEntry<any>> = {
  time: { factory: time.Widget, descriptor: time.descriptor },
}
