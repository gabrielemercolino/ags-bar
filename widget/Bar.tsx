import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { Clock, Date } from "./Time"
import { Lock, Shutdown, Reboot } from "./System"
import Workspaces from "./Workspaces"
import Title from "./Title"
import { Bluetooth, Internet } from "./Connection"
import { Audio, Battery } from "./Status"
import Tray from "./Tray"
import Notifications from "./Notifications"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox orientation={Gtk.Orientation.HORIZONTAL}>
        <Left $type="start" />
        <Center $type="center" />
        <Right $type="end" />
      </centerbox>
    </window>
  )
}

function Left() {
  return (
    <box cssName="left" spacing={16}>
      <box cssName="system">
        <Shutdown />
        <Reboot />
        <Lock />
      </box>

      <Workspaces />
    </box>
  )
}

function Center() {
  return (
    <box cssName="center">
      <Title />
    </box>
  )
}

function Right() {
  return (
    <box cssName="right" spacing={16} halign={Gtk.Align.END}>
      <box cssName="connection" spacing={12}>
        <Internet />
        <Bluetooth />
      </box>
      <box cssName="status" spacing={12}>
        <Audio />
        <Battery />
      </box>
      <box cssName="time" spacing={12}>
        <Date />
        <Clock />
      </box>
      <box cssName="apps" spacing={12}>
        <Tray />
        <Notifications />
      </box>
    </box>
  )
}
