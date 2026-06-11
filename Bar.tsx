import { Astal, Gtk, Gdk } from "ags/gtk4"
import app from "ags/gtk4/app"
import { buildWidget, registry, WidgetName } from "./widgets/registry"
import { cssManager } from "./managers/CssManager"

const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

export function buildBar(monitor: Gdk.Monitor, config: any): Astal.Window {
  applyWidgetCss(config)

  const left = resolveSection(config.bar.left, config)
  const center = resolveSection(config.bar.center, config)
  const right = resolveSection(config.bar.right, config)

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={monitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
        <box cssName="left" spacing={16} $type="start" halign={Gtk.Align.START}>
          {left}
        </box>

        <box cssName="center" spacing={16} $type="center" halign={Gtk.Align.CENTER}>
          {center}
        </box>

        <box cssName="right" spacing={16} $type="end" halign={Gtk.Align.END}>
          {right}
        </box>
      </centerbox>
    </window>
  ) as Astal.Window
}

function applyWidgetCss(config: any) {
  const widgetVars = Object
    .entries(registry)
    .reduce((acc, [name, entry]) => {
      return { ...acc, ...entry.descriptor.parseCss(config.widgets[name]) }
    }, {})

  cssManager.apply(config.colors, widgetVars)
}

function resolveSection(names: WidgetName[], config: any) {
  return names
    .filter(name => {
      if (!Object.keys(registry).includes(name)) {
        console.warn(`${name} widget not found`)
        return false
      }
      return true
    })
    .map(name => buildWidget(name, config.widgets[name]))
}
