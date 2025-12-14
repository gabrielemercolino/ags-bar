import AstalBattery from "gi://AstalBattery?version=0.1"
import { createBinding, createComputed, With } from "ags"

const battery = AstalBattery.get_default()

export default function Battery() {
  const charging = createBinding(battery, "charging")
  const percentage = createBinding(battery, "percentage")
  const timeToFull = createBinding(battery, "time_to_full")
    .as((t) => t > 0 ? `Full in ${secondsToHM(t)}` : "Full")
  const timeToEmpty = createBinding(battery, "time_to_empty")
    .as((t) => `Empty in ${secondsToHM(t)}`)

  const merged = createComputed(() => ({
    charging: charging(),
    percentage: percentage(),
    timeToFull: timeToFull(),
    timeToEmpty: timeToEmpty(),
  }))

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

function getIcon(percentage: number, charging: boolean) {
  const chargingIcons = ["󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰂉", "󰢞", "󰂊", "󰂋", "󰂅"]
  const defaultIcons = ["󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"]

  const index = Math.min(Math.round(percentage / 10), 9)
  return charging ? chargingIcons[index] : defaultIcons[index]
}

function secondsToHM(seconds: number) {
  var hours = Math.floor((seconds % (3600 * 24)) / 3600)
  var minutes = Math.floor((seconds % 3600) / 60)

  const h = hours <= 0 ? "" : `${hours}h`
  const m = minutes <= 0 ? "" : `, ${minutes}m`

  return h + m
}
