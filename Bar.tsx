import { Astal, Gtk, Gdk } from "ags/gtk4"
import app from "ags/gtk4/app"
import { buildWidget, WidgetName } from "./widgets/registry"
import { Config } from "./managers/ConfigManager"
import { BarContext } from "./BarContext"

const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

export function buildBar(monitor: Gdk.Monitor, config: Config) {
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
      <BarContext value={{ monitor }}>
        {
          () => {
            const left = resolveSection(config.bar.left, config)
            const center = resolveSection(config.bar.center, config)
            const right = resolveSection(config.bar.right, config)

            return (
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
            )
          }
        }
      </BarContext>
    </window>
  ) as Astal.Window
}

function resolveSection(names: WidgetName[], config: Config) {
  return names.map(name => buildWidget(name, config.widgets[name]))
}
