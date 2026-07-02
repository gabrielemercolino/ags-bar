import { Accessor, createBinding, createComputed, createState } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import GLib from "gi://GLib"
import AstalNetwork from "gi://AstalNetwork"
import AstalBluetooth from "gi://AstalBluetooth"
import NM from "gi://NM"
import { iconManager } from "../../managers/IconManager"
import type { Widget } from "../registry"
import { WiFiSection } from "./wifi"
import { BluetoothSection } from "./bluetooth"
import styles from "./styles.scss"

const network = AstalNetwork.get_default()
const bluetooth = AstalBluetooth.get_default()

const wired = network.get_wired()
const wifi = network.get_wifi()

type ConnectionConfig = {
  bg: string,
  fg: string,
  hover: { fg: string },
  popup: {
    bg: string,
    fg: string,
    switch: { enabled: { bg: string } },
    device: {
      fg: string,
      connected: { fg: string }
    },
    list: { bg: string },
    current: { bg: string, fg: string }
  }
}

export const widget = { render, css } satisfies Widget<ConnectionConfig>

function css(cfg: ConnectionConfig) {
  return {
    vars: {
      "--connection-bg": cfg.bg,
      "--connection-fg": cfg.fg,
      "--connection-hover-fg": cfg.hover.fg,
      "--connection-popup-bg": cfg.popup.bg,
      "--connection-popup-fg": cfg.popup.fg,
      "--connection-switch-enabled-bg": cfg.popup.switch.enabled.bg,
      "--connection-device-fg": cfg.popup.device.fg,
      "--connection-device-connected-fg": cfg.popup.device.connected.fg,
      "--connection-list-bg": cfg.popup.list.bg,
      "--connection-current-bg": cfg.popup.current.bg,
      "--connection-current-fg": cfg.popup.current.fg,
    },
    css: styles
  }
}

function render({ }: ConnectionConfig) {
  return (
    <menubutton cssName="connection" cursor={Gdk.Cursor.new_from_name("pointer", null)}>
      <box spacing={12}>
        <NetworkBarIcon />
        <BluetoothBarIcon />
      </box>

      <popover cssName="pop-up">
        <ConnectionContent />
      </popover>
    </menubutton>
  ) as Gtk.Widget
}

function ConnectionContent() {
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={10} widthRequest={280}>
      <box spacing={10} homogeneous>
        <CurrentNetworkDevice />
        <CurrentBluetoothDevice />
      </box>

      <WiFiSection />
      <BluetoothSection />
    </box>
  )
}

function createTrafficMonitor(iface: Accessor<string | null>) {
  const [rxSpeed, setRxSpeed] = createState(0)
  const [txSpeed, setTxSpeed] = createState(0)

  let cache = { rx: 0, tx: 0, time: 0 }

  const poll = () => {
    const name = iface()
    if (!name) return

    const [ok, bytes] = GLib.file_get_contents("/proc/net/dev")
    if (!ok) return

    const text = new TextDecoder().decode(bytes)
    const now = Date.now()

    for (const line of text.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed.startsWith(name)) continue

      const parts = trimmed.split(/\s+/)
      const rx = parseInt(parts[1], 10)
      const tx = parseInt(parts[9], 10)

      const dt = (now - cache.time) / 1000
      if (cache.time > 0 && dt > 0) {
        setRxSpeed(Math.max(0, Math.round((rx - cache.rx) / dt)))
        setTxSpeed(Math.max(0, Math.round((tx - cache.tx) / dt)))
      }

      cache = { rx, tx, time: now }
      break
    }
  }

  setInterval(poll, 1000)
  poll()

  return { rxSpeed, txSpeed }
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond >= 1_000_000)
    return `${(bytesPerSecond / 1_000_000).toFixed(1)}M`
  if (bytesPerSecond >= 1_000)
    return `${(bytesPerSecond / 1_000).toFixed(1)}K`
  return `${bytesPerSecond}B`
}

function CurrentNetworkDevice() {
  const connectivity = createBinding(network, "primary")

  const wiredDevice = createComputed(() => {
    const c = connectivity()
    if (c !== AstalNetwork.Primary.WIRED) return null
    const w = network.get_wired()
    return w?.device ?? null
  })

  const wifiActiveAp = wifi
    ? createBinding(wifi, "active_access_point")
    : new Accessor(() => null)

  const icon = createComputed(() => {
    const c = connectivity()
    if (c === AstalNetwork.Primary.WIRED)
      return iconManager.getNetworkIcon({ type: "wired" })
    if (c === AstalNetwork.Primary.WIFI)
      return iconManager.getNetworkIcon({ type: "wifi", strength: wifi?.strength ?? 0 })
    return iconManager.getNetworkIcon({ type: "offline" })
  })

  const iface = createComputed(() => {
    const c = connectivity()
    if (c === AstalNetwork.Primary.WIRED)
      return wiredDevice()?.get_iface() ?? null
    if (c === AstalNetwork.Primary.WIFI)
      return wifi?.device.get_iface() ?? null
    return null
  })

  const { rxSpeed, txSpeed } = createTrafficMonitor(iface)

  const speedLabel = createComputed(() => {
    const c = connectivity()
    if (c === AstalNetwork.Primary.UNKNOWN) return "offline"
    return `↓${formatSpeed(rxSpeed())} ↑${formatSpeed(txSpeed())}`
  })

  const tooltipName = createComputed(() => {
    const c = connectivity()
    if (c === AstalNetwork.Primary.WIRED)
      return wiredDevice()?.get_iface() ?? "Unknown"
    if (c === AstalNetwork.Primary.WIFI)
      return wifiActiveAp()?.get_ssid() || wifiActiveAp()?.get_bssid() || "Unknown"
    return "offline"
  })

  return (
    <box cssName="current-device" orientation={Gtk.Orientation.VERTICAL} spacing={4} hexpand valign={Gtk.Align.END} tooltipText={tooltipName}>
      <label cssName="icon" label={icon} halign={Gtk.Align.CENTER} hexpand />
      <label cssName="stats" label={speedLabel} halign={Gtk.Align.CENTER} hexpand />
    </box>
  )
}

function CurrentBluetoothDevice() {
  const connected = bluetooth
    ? createBinding(bluetooth, "isConnected")
    : new Accessor(() => false)

  const powered = bluetooth
    ? createBinding(bluetooth, "isPowered")
    : new Accessor(() => false)

  const devices = bluetooth
    ? createBinding(bluetooth, "devices")
    : new Accessor(() => [])

  const battery = createComputed(() => {
    const d = devices().find(d => d.connected)
    if (!d) return -1
    return d.battery_percentage
  })

  const showBattery = createComputed(() => connected() && battery() >= 0)

  const iconWithBattery = createComputed(() => {
    if (showBattery())
      return iconManager.getBatteryIcon(battery() * 100, false)
    return ""
  })

  const icon = createComputed(() => {
    if (connected()) return iconManager.getBluetoothIcon({ state: "connected" })
    if (powered()) return iconManager.getBluetoothIcon({ state: "powered" })
    return iconManager.getBluetoothIcon({ state: "off" })
  })

  const batteryText = createComputed(() => `${Math.round(battery() * 100)}%`)

  const btStatusLabel = createComputed(() => {
    if (showBattery()) return `${iconWithBattery()} ${batteryText()}`
    if (connected()) return "connected"
    if (powered()) return "idle"
    return "off"
  })

  const name = createComputed(() => {
    if (connected()) {
      const d = devices().find(d => d.connected)
      if (d) return d.name || d.alias || "Unknown"
    }
    if (powered()) return "idle"
    return "off"
  })

  return (
    <box cssName="current-device" orientation={Gtk.Orientation.VERTICAL} spacing={4} hexpand valign={Gtk.Align.END} tooltipText={name}>
      <label cssName="icon" label={icon} halign={Gtk.Align.CENTER} hexpand />
      <label cssName="stats" label={btStatusLabel} halign={Gtk.Align.CENTER} hexpand />
    </box>
  )
}

function NetworkBarIcon() {
  const connectivity = createBinding(network, "primary")

  const wiredDevice = wired
    ? createBinding(wired, "device") as Accessor<NM.DeviceEthernet | null>
    : new Accessor(() => null)

  const wifiActiveAp = wifi
    ? createBinding(wifi, "active_access_point") as Accessor<AstalNetwork.AccessPoint | null>
    : new Accessor(() => null)

  const icon = createComputed(() => {
    const c = connectivity()
    if (c === AstalNetwork.Primary.WIRED)
      return iconManager.getNetworkIcon({ type: "wired" })
    if (c === AstalNetwork.Primary.WIFI)
      return iconManager.getNetworkIcon({ type: "wifi", strength: wifi?.strength ?? 0 })
    return iconManager.getNetworkIcon({ type: "offline" })
  })

  const label = createComputed(() => {
    const c = connectivity()
    if (c === AstalNetwork.Primary.WIRED)
      return wiredDevice()?.get_iface() ?? "Unknown"
    if (c === AstalNetwork.Primary.WIFI)
      return wifiActiveAp()?.get_ssid() || wifiActiveAp()?.get_bssid() || "Unknown"
    return "offline"
  })

  return <label label={icon} tooltipText={label} />
}

function BluetoothBarIcon() {
  const btConnected = bluetooth
    ? createBinding(bluetooth, "isConnected")
    : new Accessor(() => false)

  const btPowered = bluetooth
    ? createBinding(bluetooth, "isPowered")
    : new Accessor(() => false)

  const icon = createComputed(() => {
    if (btConnected()) return iconManager.getBluetoothIcon({ state: "connected" })
    if (btPowered()) return iconManager.getBluetoothIcon({ state: "powered" })
    return iconManager.getBluetoothIcon({ state: "off" })
  })

  return <label label={icon} />
}
