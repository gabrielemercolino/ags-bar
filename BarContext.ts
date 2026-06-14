import { createContext } from "ags"
import { Gdk } from "ags/gtk4"

export type BarContext = {
  monitor: Gdk.Monitor
}

export const BarContext = createContext<BarContext>(null!)
