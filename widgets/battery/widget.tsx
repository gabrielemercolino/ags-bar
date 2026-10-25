import { createBinding, createComputed } from "ags";
import { Gtk } from "ags/gtk4";
import AstalBattery from "gi://AstalBattery";
import type { Widget } from "../registry";
import { iconManager } from "../../managers/IconManager";
import styles from "./styles.scss";

const battery = AstalBattery.get_default()

type BatteryConfig = {
  show: boolean,

  // css
  bg: string,
  fg: string,
  charging: { fg: string }
}

export const widget = { render, css } satisfies Widget<BatteryConfig>

function css(cfg: BatteryConfig) {
  return {
    vars: {
      "--battery-bg": cfg.bg,
      "--battery-fg": cfg.fg,
      "--battery-charging-fg": cfg.charging.fg
    },
    css: styles
  }
}

function render({ show }: BatteryConfig) {
  const charging = createBinding(battery, "charging")
  const percentage = createBinding(battery, "percentage")
    .as(p => Math.round(p * 100))
  const timeToFull = createBinding(battery, "time_to_full")
    .as((t) => t > 0 ? `Full in ${secondsToHM(t)}` : "Full")
  const timeToEmpty = createBinding(battery, "time_to_empty")
    .as((t) => `Empty in ${secondsToHM(t)}`)

  return (
    <box
      visible={show && battery.isPresent}
      cssName="battery"
      class={charging.as(c => c ? "charging" : "")}
    >
      <label
        label={createComputed(() => `${iconManager.getBatteryIcon(percentage(), charging())} ${percentage()}%`)}
        tooltipText={createComputed(() => charging() ? timeToFull() : timeToEmpty())} />
    </box>
  ) as Gtk.Widget
}

function secondsToHM(seconds: number) {
  var hours = Math.floor((seconds % (3600 * 24)) / 3600)
  var minutes = Math.floor((seconds % 3600) / 60)

  const h = hours <= 0 ? "" : `${hours}`
  const m = minutes <= 0 ? "" : `:${minutes >= 10 ? minutes : `0${minutes}`}`

  return h + m
}

