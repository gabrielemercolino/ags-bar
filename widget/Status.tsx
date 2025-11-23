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

  const both = createComputed([charging, percentage], (c, p) => {
    return {
      charging: c,
      percentage: p,
    }
  })

  function getIcon(percentage: number, charging: boolean) {
    const chargingIcons = ["󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰂉", "󰢞", "󰂊", "󰂋", "󰂅"]
    const defaultIcons = ["󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"]

    const index = Math.min(Math.round(percentage / 10), 9)
    return charging ? chargingIcons[index] : defaultIcons[index]
  }

  return (
    <With value={both}>
      {({ charging, percentage }) => {
        const rounded = Math.round(percentage * 100)
        return (
          <box
            visible={battery.isPresent}
            cssName="battery"
            class={charging ? "charging" : ""}
          >
            {`${getIcon(rounded, charging)} ${rounded}%`}
          </box>
        )
      }}
    </With>
  )
}
