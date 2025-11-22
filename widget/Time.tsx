import { createPoll } from "ags/time"
import Gtk from "gi://Gtk?version=4.0"

export function Date() {
  const date = createPoll("", 60_000, 'date "+%a %d %b"')

  return (
    <menubutton cssName="date" hexpand halign={Gtk.Align.CENTER}>
      <label label={date.as((d) => `󰸘 ${d}`)} />
      <popover>
        <Gtk.Calendar cssName="calendar" />
      </popover>
    </menubutton>
  )
}

export function Clock() {
  const time = createPoll("", 1000, 'date "+%H:%M"')

  return (
    <label
      cssName="clock"
      hexpand
      halign={Gtk.Align.CENTER}
      label={time.as((t) => ` ${t}`)}
    />
  )
}
