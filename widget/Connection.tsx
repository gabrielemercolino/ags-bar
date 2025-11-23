import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import { createBinding, With } from "gnim"
import { execAsync } from "ags/process"
import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { bluetoothCommand } from "../commands"

const network = AstalNetwork.get_default()

export function Internet() {
  const wired = createBinding(network, "wired")
  const wifi = createBinding(network, "wifi")

  const name = wifi.as((wf) => {
    if (wf && wf.get_ssid()) return `󰤨  ${wf.get_ssid()}`
    const wd = wired.get()
    return wd ? "󰀂  wired" : "󰖪  offline"
  })

  return (
    <With value={name}>
      {(n) => (
        <label
          cssName="internet"
          label={n}
          tooltipText={
            wifi.get().get_ssid()
              ? createBinding(wifi.get(), "strength").as((s) => `${s}%`)
              : undefined
          }
        />
      )}
    </With>
  )
}

const bluetooth = AstalBluetooth.get_default()

export function Bluetooth() {
  const on = createBinding(bluetooth, "isPowered")
  return (
    <button
      cssName="bluetooth"
      onClicked={() => execAsync(bluetoothCommand()).catch(printerr)}
    >
      <With value={on}>{(on) => <label label={on ? " on" : " off"} />}</With>
    </button>
  )
}
