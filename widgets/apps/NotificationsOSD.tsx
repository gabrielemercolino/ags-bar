import { createBinding, For } from "ags"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import Pango from "gi://Pango"
import { NotificationsOSDManager, OSDMessage } from "./NotificationsOSDManager"

const { TOP } = Astal.WindowAnchor
const { START, CENTER } = Gtk.Align

export type NotifOSDConfig = {
  duration: number,
  maxMessages: number,

  // css
  progress: { fg: string }
}
export function NotificationsOSD(monitor: Gdk.Monitor, config: NotifOSDConfig) {
  const manager = new NotificationsOSDManager(config)
  const entries = createBinding(manager, "list")

  const win = (
    <window
      visible={entries.as((list: OSDMessage[]) => list.length > 0)}
      gdkmonitor={monitor}
      cssName="notif-osd"
      layer={Astal.Layer.OVERLAY}
      anchor={TOP}
      exclusivity={Astal.Exclusivity.IGNORE}
    >
      <box
        cssName="osd-container"
        valign={START}
        halign={CENTER}
        widthRequest={300}
        spacing={6}
        orientation={Gtk.Orientation.VERTICAL}
      >
        <For each={entries}>
          {(entry: OSDMessage) => <NotificationCard entry={entry} />}
        </For>
      </box>
    </window>
  ) as Astal.Window

  return { destroy: () => { manager.destroy(); win.destroy() } }
}

type NotificationCardProps = {
  entry: OSDMessage
}
function NotificationCard({ entry }: NotificationCardProps) {
  const image = entry.notification.get_image()

  return (
    <revealer
      revealChild={createBinding(entry, "visible")}
      transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
      transitionDuration={250}
    >
      <box
        orientation={Gtk.Orientation.VERTICAL}
        spacing={2}
        cursor={Gdk.Cursor.new_from_name("pointer", null)}
        $={(self: Gtk.Widget) => {
          const motion = Gtk.EventControllerMotion.new()
          motion.connect("enter", () => entry.pause())
          motion.connect("leave", () => entry.resume())
          self.add_controller(motion)

          const click = Gtk.GestureClick.new()
          click.connect("pressed", () => entry.notification.get_actions().at(0)?.invoke())
          self.add_controller(click)
        }}
      >
        <box orientation={Gtk.Orientation.VERTICAL} cssName="osd-card" spacing={4}>
          <levelbar
            cssName="osd-progress"
            minValue={0}
            maxValue={1}
            heightRequest={4}
            value={createBinding(entry, "progress")}
          />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <label
              label={entry.notification.get_app_name()}
              cssName="app-name"
              halign={START}
            />
            <label
              label={entry.notification.get_summary()}
              cssName="summary"
              halign={START}
            />
          </box>
          <box orientation={Gtk.Orientation.HORIZONTAL} spacing={6}>
            <image
              visible={!!image}
              file={image || ""}
              pixelSize={20}
              valign={START}
            />
            <label
              label={entry.notification.get_body()}
              cssName="body"
              useMarkup
              halign={START}
              wrap
              ellipsize={Pango.EllipsizeMode.END}
              maxWidthChars={28}
            />
          </box>
        </box>
      </box>
    </revealer>
  )
}
