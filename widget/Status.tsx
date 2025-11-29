import { execAsync } from "ags/process"
import { createBinding, createComputed, With } from "gnim"
import AstalBattery from "gi://AstalBattery?version=0.1"
import { audioCommand } from "../commands"
import AstalWp from "gi://AstalWp?version=0.1"

const wireplumber = AstalWp.get_default()

export function Audio() {
  const muted = createBinding(wireplumber.get_default_speaker(), "mute")
  const volume = createBinding(wireplumber.get_default_speaker(), "volume")

  const both = createComputed([muted, volume], (m, v) => {
    return {
      muted: m,
      volume: v,
    }
  })

  return (
    <button
      cssName="audio"
      onClicked={() => execAsync(audioCommand()).catch(console.error)}
    >
      <With value={both}>
        {({ muted, volume }) => (
          <label label={muted ? " " : ` ${Math.round(volume * 100)}%`} />
        )}
      </With>
    </button>
  )
}

const battery = AstalBattery.get_default()

export function Battery() {
  const charging = createBinding(battery, "charging")
  const percentage = createBinding(battery, "percentage")
  const timeToFull = createBinding(battery, "timeToFull").as((t) =>
    t > 0 ? `Full in ${secondsToHM(t)}` : "Full",
  )
  const timeToEmpty = createBinding(battery, "timeToEmpty").as(
    (t) => `Empty in ${secondsToHM(t)}`,
  )

  const merged = createComputed(
    [charging, percentage, timeToFull, timeToEmpty],
    (c, p, ttf, tte) => {
      return {
        charging: c,
        percentage: p,
        timeToFull: ttf,
        timeToEmpty: tte,
      }
    },
  )

  function getIcon(percentage: number, charging: boolean) {
    const chargingIcons = ["󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰂉", "󰢞", "󰂊", "󰂋", "󰂅"]
    const defaultIcons = ["󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"]

    const index = Math.min(Math.round(percentage / 10), 9)
    return charging ? chargingIcons[index] : defaultIcons[index]
  }

  function secondsToHM(seconds: number) {
    var hours = Math.floor((seconds % (3600 * 24)) / 3600)
    var minutes = Math.floor((seconds % 3600) / 60)

    const h = hours <= 0 ? "" : `${hours}h, `
    const m = minutes <= 0 ? "" : `${minutes}m`

    return h + m
  }

  return (
    <With value={merged}>
      {({ charging, percentage, timeToFull, timeToEmpty }) => {
        const rounded = Math.round(percentage * 100)
        return (
          <box
            visible={battery.isPresent}
            cssName="battery"
            tooltipText={charging ? timeToFull : timeToEmpty}
            class={charging ? "charging" : ""}
          >
            {`${getIcon(rounded, charging)} ${rounded}%`}
          </box>
        )
      }}
    </With>
  )
}
