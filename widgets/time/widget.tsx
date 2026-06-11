import { Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { Descriptor } from "../registry";

interface TimeConfig {
  clock: { show: boolean; format: string }
  date: { show: boolean; format: string }
}

export function Widget({ clock, date }: TimeConfig) {
  const dateVal = createPoll("", 60_000, `date "${date.format}"`)
  const timeVal = createPoll("", 1000, `date "${clock.format}"`)

  return (
    <menubutton
      cssName="time"
      hexpand halign={Gtk.Align.CENTER}
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <box spacing={8}>
        <label visible={date.show} hexpand label={dateVal.as(d => `󰸘 ${d}`)} />
        <label visible={clock.show} hexpand label={timeVal.as(t => ` ${t}`)} />
      </box>
      <popover cssName="pop-up">
        <Gtk.Calendar cssName="calendar" />
      </popover>
    </menubutton>
  )
}

export const descriptor = {
  parseCss: (raw) => ({
    "--time-bg": raw.bg,
    "--time-fg": raw.fg,

    "--time-hover-fg": raw.hover.fg,
    "--time-hover-bg": raw.hover.bg,

    "--time-popup-bg": raw.popup.bg,

    "--time-popup-controls-fg": raw.popup.controls.fg,
    "--time-popup-controls-hover-fg": raw.popup.controls.hover.fg,

    "--time-popup-calendar-week-fg": raw.popup.calendar.week.fg,

    "--time-popup-calendar-day-fg": raw.popup.calendar.day.fg,
    "--time-popup-calendar-day-bg": raw.popup.calendar.day.bg,

    "--time-popup-calendar-day-selected-fg": raw.popup.calendar.day.selected.fg,
    "--time-popup-calendar-day-selected-bg": raw.popup.calendar.day.selected.bg,

    "--time-popup-calendar-day-today-fg": raw.popup.calendar.day.today.fg,
    "--time-popup-calendar-day-today-bg": raw.popup.calendar.day.today.bg,
    "--time-popup-calendar-day-today-outline": raw.popup.calendar.day.today.outline,
  }),
} satisfies Descriptor
