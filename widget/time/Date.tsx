import { Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

export default function Date() {
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
