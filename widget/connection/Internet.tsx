import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { Accessor, createBinding, createComputed, With } from "ags"

const network = AstalNetwork.get_default()

export default function Internet() {
  const connectivity = createBinding(network, "primary")

  const connectionState = createComputed(() => {
    if (connectivity() === AstalNetwork.Primary.WIFI) return "wifi"
    if (connectivity() === AstalNetwork.Primary.WIRED) return "wired"
    return "offline"
  })

  return (
    <box>
      <With value={connectionState}>
        {(state) => {
          if (state === "wifi") return <WiFiWidget />
          if (state === "wired") return <WiredWidget />
          else
            return <label cssName="internet" label="󰖪" tooltipText="offline" />
        }}
      </With>
    </box>
  )
}

function WiFiWidget() {
  const strength = createBinding(network.wifi, "strength")
  const ssid = createBinding(network.wifi, "ssid")

  const state = createComputed(() => ({
    strength: strength(),
    icon: getWifiIcon(strength()),
    ssid: ssid(),
  }))

  return (
    <box>
      <With value={state}>
        {(state) => (
          <label
            cssName="internet"
            label={state.icon}
            tooltipText={`${state.ssid} ${state.strength}%`}
          />
        )}
      </With>
    </box>
  )
}

function WiredWidget() {
  const name = createBinding(network.wired.device, "interface")

  return (
    <box>
      <With value={name}>
        {(name) => <label cssName="internet" label="󰀂" tooltipText={name} />}
      </With>
    </box>
  )
}

function getWifiIcon(strength: number): string {
  if (strength >= 80) return "󰤨"
  if (strength >= 60) return "󰤥"
  if (strength >= 40) return "󰤢"
  if (strength >= 20) return "󰤟"
  return "󰤯"
}
