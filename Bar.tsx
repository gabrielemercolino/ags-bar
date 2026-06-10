import { Astal, Gtk, Gdk } from "ags/gtk4"
import app from "ags/gtk4/app"
import { registry } from "./widgets/registry"
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

function resolveSection(names: string[], config: any) {
  return names
    .map(name => resolveWidget(name, config))
    .filter((w) => w !== null)
}

function resolveWidget(name: string, config: any) {
  const entry = registry[name]

  if (!entry) {
    console.warn(`Unknown widget: "${name}"`)
    return null
  }

  const behaviorConfig = entry.descriptor.parseParams(config.widgets[name])
  const Factory = entry.factory
  return <Factory {...behaviorConfig} />
}
