import { Gdk, Gtk } from "ags/gtk4"
import { createPoll } from "ags/time"

export default function Date() {
  const date = createPoll("", 60_000, 'date "+%a %d %b"')

  return (
    <menubutton
      cssName="date"
      hexpand
      halign={Gtk.Align.CENTER}
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <label label={date.as((d) => `󰸘 ${d}`)} />
      <popover cssName="pop-up">
        <Gtk.Calendar cssName="calendar" />
      </popover>
    </menubutton>
  )
}
