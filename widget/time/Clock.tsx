import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

export default function Clock() {
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
