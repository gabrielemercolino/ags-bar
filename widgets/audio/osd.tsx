import { Astal, Gdk, Gtk } from "ags/gtk4"
import { iconManager } from "../../managers/IconManager"
import GLib from "gi://GLib"
import cairo from "cairo"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
const { START, CENTER, END } = Gtk.Align

type Position = {
  valign: Gtk.Align
  halign: Gtk.Align
}

const positionMap = {
  "top-left": { valign: START, halign: START },
  "top-center": { valign: START, halign: CENTER },
  "top-right": { valign: START, halign: END },
  "center-left": { valign: CENTER, halign: START },
  "center-center": { valign: CENTER, halign: CENTER },
  "center-right": { valign: CENTER, halign: END },
  "bottom-left": { valign: END, halign: START },
  "bottom-center": { valign: END, halign: CENTER },
  "bottom-right": { valign: END, halign: END },
} satisfies Record<string, Position>

type OSDPosition = keyof typeof positionMap

export type AudioOSDConfig = {
  hideAfter: number,
  position: OSDPosition,
  compact: boolean,

  // css
  bg: string,
  fg: string,
  trough: { bg: string },
}

export function AudioOsd(monitor: Gdk.Monitor, { hideAfter: hideDelayMs, position, compact }: AudioOSDConfig) {
  let timeoutId: number | null = null

  const pos = positionMap[position] ?? positionMap["center-center"]

  const icon = <label cssName="icon" /> as Gtk.Label
  const percentage = <label cssName="value" widthChars={5} /> as Gtk.Label
  const bar = <levelbar cssName="levelbar" minValue={0} maxValue={100} widthRequest={100} valign={CENTER} /> as Gtk.LevelBar

  const contentBox = compact
    ? <CompactLayout valign={pos.valign} halign={pos.halign} icon={icon} percentage={percentage} bar={bar} />
    : <NormalLayout valign={pos.valign} halign={pos.halign} icon={icon} percentage={percentage} bar={bar} />

  const win = (
    <window
      visible={false}
      gdkmonitor={monitor}
      cssName="audio-osd"
      layer={Astal.Layer.OVERLAY}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      exclusivity={Astal.Exclusivity.IGNORE}
      canTarget={false}
    >
      {contentBox}
    </window>
  ) as Astal.Window

  win.connect("realize", () => {
    const surface = win.get_surface()
    if (surface) surface.set_input_region(new cairo.Region())
  })

  const hide = () => {
    win?.set_visible(false)
    if (timeoutId !== null) {
      GLib.source_remove(timeoutId)
      timeoutId = null
    }
  }

  const scheduleHide = () => {
    if (timeoutId !== null) GLib.source_remove(timeoutId)
    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, hideDelayMs, () => {
      hide()
      return GLib.SOURCE_REMOVE
    })
  }

  const show = (type: "speaker" | "microphone", volume: number, muted: boolean) => {
    icon.label = iconManager.getAudioIcon(type, muted, volume)
    bar.value = volume
    percentage.label = `${Math.round(volume)}%`
    win.set_visible(true)
    scheduleHide()
  }

  const destroy = () => {
    if (timeoutId !== null) GLib.source_remove(timeoutId)
    win?.destroy()
  }

  return { show, destroy }
}

type LayoutProps = {
  valign: Gtk.Align,
  halign: Gtk.Align,
  icon: Gtk.Label,
  percentage: Gtk.Label,
  bar: Gtk.LevelBar
}

function CompactLayout({ valign, halign, icon, percentage, bar }: LayoutProps) {
  const classes = []
  if (valign === Gtk.Align.START) classes.push("vtop")

  return (
    <box
      cssName="content"
      cssClasses={classes}
      valign={valign}
      halign={halign}
      orientation={Gtk.Orientation.VERTICAL}
      spacing={6}
    >
      <box cssName="top-row" spacing={6} halign={CENTER}>
        {icon}
        {percentage}
      </box>
      {bar}
    </box>
  ) as Gtk.Widget
}

function NormalLayout({ valign, halign, icon, percentage, bar }: LayoutProps) {
  const classes = ["normal"]
  if (valign === Gtk.Align.START) classes.push("vtop")

  return (
    <box
      cssName="content"
      cssClasses={classes}
      valign={valign}
      halign={halign}
      orientation={Gtk.Orientation.HORIZONTAL}
      spacing={10}
    >
      {icon}
      {bar}
      {percentage}
    </box>
  ) as Gtk.Widget
}
