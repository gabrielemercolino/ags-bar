import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { Accessor, createBinding, createComputed, With } from "ags"

const network = AstalNetwork.get_default()

type ConnectionState =
  | {
      type: "wifi"
      icon: string
      ssid: string
      strength: number
    }
  | {
      type: "wired"
      icon: string
      interface: string
    }
  | {
      type: "offline"
      icon: string
    }

export default function Internet() {
  const connectivity = createBinding(network, "primary")

  const connectionState: Accessor<ConnectionState> = createComputed(() => {
    if (connectivity() == AstalNetwork.Primary.WIFI)
      return getWiFiState(network.wifi)
    if (connectivity() == AstalNetwork.Primary.WIRED)
      return getWiredState(network.wired)
    return {
      type: "offline",
      icon: "󰖪",
    }
  })

  return (
    <box>
      <With value={connectionState}>
        {(state) => (
          <label
            cssName="internet"
            label={state.icon}
            tooltipText={generateTooltip(state)}
          />
        )}
      </With>
    </box>
  )
}

function getWiredState(wired: AstalNetwork.Wired): ConnectionState {
  return {
    type: "wired",
    icon: "󰀂",
    interface: wired.device.interface,
  }
}

function getWiFiState(wifi: AstalNetwork.Wifi): ConnectionState {
  return {
    type: "wifi",
    icon: getWifiIcon(wifi.strength),
    ssid: wifi.ssid,
    strength: wifi.strength,
  }
}

function getWifiIcon(strength: number): string {
  if (strength >= 80) return "󰤨"
  if (strength >= 60) return "󰤥"
  if (strength >= 40) return "󰤢"
  if (strength >= 20) return "󰤟"
  return "󰤯"
}

function generateTooltip(state: ConnectionState): string {
  switch (state.type) {
    case "offline":
      return "offline"
    case "wifi":
      return `${state.ssid} ${state.strength}%`
    case "wired":
      return state.interface
  }
}
