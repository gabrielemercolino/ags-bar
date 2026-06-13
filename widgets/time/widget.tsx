import { Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { Descriptor } from "../registry";

interface TimeConfig {
  clock: { show: boolean; format: string },
  date: { show: boolean; format: string }

  // css
  bg: string,
  fg: string,
  hover: { bg: string, fg: string, },
  popup: {
    bg: string, fg: string,
    controls: { fg: string, hover: { fg: string } },
    calendar: {
      week: { fg: string },
      day: {
        bg: string, fg: string,
        selected: { bg: string, fg: string },
        today: { bg: string, fg: string, outline: string },
      },
    };
  },
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
  ) as Gtk.Widget
}

export const descriptor = {
  parseCss: (cfg) => ({
    "--time-bg": cfg.bg,
    "--time-fg": cfg.fg,

    "--time-hover-fg": cfg.hover.fg,
    "--time-hover-bg": cfg.hover.bg,

    "--time-popup-bg": cfg.popup.bg,

    "--time-popup-controls-fg": cfg.popup.controls.fg,
    "--time-popup-controls-hover-fg": cfg.popup.controls.hover.fg,

    "--time-popup-calendar-week-fg": cfg.popup.calendar.week.fg,

    "--time-popup-calendar-day-fg": cfg.popup.calendar.day.fg,
    "--time-popup-calendar-day-bg": cfg.popup.calendar.day.bg,

    "--time-popup-calendar-day-selected-fg": cfg.popup.calendar.day.selected.fg,
    "--time-popup-calendar-day-selected-bg": cfg.popup.calendar.day.selected.bg,

    "--time-popup-calendar-day-today-fg": cfg.popup.calendar.day.today.fg,
    "--time-popup-calendar-day-today-bg": cfg.popup.calendar.day.today.bg,
    "--time-popup-calendar-day-today-outline": cfg.popup.calendar.day.today.outline,
  }),
} satisfies Descriptor<TimeConfig>
