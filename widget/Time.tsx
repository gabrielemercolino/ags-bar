import { Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"

export default function Time() {
  const date = createPoll("", 60_000, 'date "+%a %d %b"')
  const time = createPoll("", 1000, 'date "+%H:%M"')

  return (
    <menubutton
      cssName="time"
      hexpand
      halign={Gtk.Align.CENTER}
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <box spacing={8}>
        <label
          hexpand
          label={date.as((d) => `󰸘 ${d}`)}
        />

        <label
          hexpand
          label={time.as((t) => ` ${t}`)}
        />
      </box>

      <popover cssName="pop-up">
        <Gtk.Calendar cssName="calendar" />
      </popover>
    </menubutton>
  )
}
