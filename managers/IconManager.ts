import { exec } from "ags/process"
import { readFile } from "ags/file"
import { getDataDir } from "../utils"

const ICONS_PATH = `${getDataDir()}/icons.toml`

class IconManager {
  private icons: Record<string, Record<string, any>>

  constructor() {
    const json = exec(`tomlq -r '.' ${ICONS_PATH}`)
    this.icons = JSON.parse(json)
  }

  getDistroIcon(os: string) {
    if (os === "auto") {
      const osRelease = readFile("/etc/os-release")
      const id = osRelease.match(/^ID=(.+)$/m)?.[1]?.toLowerCase().trim() ?? ""
      return this.icons.os[id] ?? this.icons.os.fallback
    }

    return this.icons.os[os] ?? this.icons.os.fallback
  }

  getBatteryIcon(percentage: number, charging: boolean) {
    const index = Math.min(Math.round(percentage / 10), 9)
    return this.icons.battery[charging ? "charging" : "discharging"][index]
  }

  getAudioIcon(type: "speaker" | "microphone", muted: boolean, volume: number) {
    if (muted) return this.icons.audio[type].muted
    const levels = this.icons.audio[type].levels
    const index = Math.min(Math.floor(volume / (100 / levels.length)), levels.length - 1)
    return levels[index]
  }

  getNetworkIcon(params: { type: "wired" | "offline" | "lock" }): string
  getNetworkIcon(params: { type: "wifi"; strength: number }): string
  getNetworkIcon(params: { type: "wired" | "offline" | "lock" | "wifi"; strength?: number }) {
    if (params.type === "wifi")
      return this.icons.network.wifi_levels[Math.min(Math.max(0, Math.floor(Number(params.strength!) / 20)), 4)]
    return this.icons.network[params.type]
  }


  getGeneralIcon(key: string) {
    return this.icons.general[key]
  }

  getNotificationsIcon(key: string) {
    return this.icons.notifications[key]
  }

  getBluetoothIcon(params: { state: "connected" | "powered" | "off" } | { deviceType: string } | { paired: boolean }): string {
    if ("state" in params) return this.icons.bluetooth[params.state]
    if ("deviceType" in params) return this.icons.bluetooth.device_types[params.deviceType] ?? this.icons.bluetooth.device_types.fallback
    return this.icons.bluetooth[params.paired ? "paired" : "unpaired"]
  }
}

export const iconManager = new IconManager()
