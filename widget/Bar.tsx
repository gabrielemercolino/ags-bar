import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import Workspaces from "./Workspaces"
import Title from "./Title"
import Internet from "./connection/Internet"
import Bluetooth from "./connection/Bluetooth"
import Audio from "./status/Audio"
import Battery from "./status/Battery"
import Clock from "./time/Clock"
import Date from "./time/Date"
import Tray from "./apps/Tray"
import Notifications from "./apps/Notifications"
import Shutdown from "./system/Shutdown"
import Reboot from "./system/Reboot"
import Lock from "./system/Lock"
import Microphone from "./status/Microphone"

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
        <Microphone />
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
