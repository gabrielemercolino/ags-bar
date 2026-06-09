import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import Workspaces from "./Workspaces"
import Title from "./Title"
import Battery from "./status/Battery"
import Tray from "./apps/Tray"
import Notifications from "./apps/Notifications"
import System from "./System"
import AudioMenu from "./Audio"
import Connection from "./Connection"
import Time from "./Time"

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
      <System />
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
      <Connection />
      <AudioMenu />
      <Battery />
      <Time />

      <box cssName="apps" spacing={8}>
        <Tray />
        <Notifications />
      </box>
    </box>
  )
}
