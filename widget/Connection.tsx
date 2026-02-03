import AstalNetwork from "gi://AstalNetwork?version=0.1"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import { Accessor, createBinding, createComputed, For, With } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import Pango from "gi://Pango"
import Button from "../components/Button"

const network = AstalNetwork.get_default()
const bluetooth = AstalBluetooth.get_default()
const adapter = bluetooth?.get_adapter()

export default function Connection() {
  return (
    <menubutton cssName="connection" cursor={Gdk.Cursor.new_from_name("pointer", null)}>
      <box spacing={12}>
        <NetworkWidget />
        <BluetoothWidget />
      </box>

      <popover cssName="pop-up">
        <box orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
          <NetworkColumn />
          <BluetoothColumn />
        </box>
      </popover>
    </menubutton>
  )
}

function NetworkWidget() {
  const wiredState = createBinding(network.wired, "state")
  const wifiStrength = createBinding(network.wifi, "strength")
  const wifiEnabled = createBinding(network.wifi, "enabled")

  const state = createComputed(() => {
    const wired = wiredState() === AstalNetwork.DeviceState.ACTIVATED
    const wifiOn = wifiEnabled()
    const wifiAP = network.wifi?.get_active_access_point()

    if (wired) return { type: "wired" as const, name: network.wired?.device?.interface || "" }
    if (wifiOn) return { type: "wifi" as const, name: wifiAP?.get_ssid() || wifiAP?.get_bssid() || "", strength: wifiStrength() }
    return { type: "offline" as const }
  })

  return (
    <box>
      <With value={state}>
        {(state) => {
          if (state.type === "wired") return <label label="󰀂" tooltipText={state.name} />
          if (state.type === "wifi") return <label label={getWiFiIcon(state.strength)} tooltipText={state.name} />
          return <label label="󰖪" />
        }}
      </With>
    </box>
  )
}

function BluetoothWidget() {
  const powered = createBinding(bluetooth, "isPowered")
  const connected = createBinding(bluetooth, "isConnected")

  const state = createComputed(() => ({
    connected: connected(),
    powered: powered()
  }))

  return (
    <box>
      <With value={state}>
        {(state) => {
          if (state.connected) return <label label="󰂱" />
          if (state.powered) return <label label="" />
          return <label label="󰂲" />
        }}
      </With>
    </box>
  )
}

function WiredSection() {
  const state = createBinding(network.wired, "state")
  const visible = state.as(s => s === AstalNetwork.DeviceState.ACTIVATED)
  const iface = createBinding(network.wired?.device, "interface")

  return (
    <revealer revealChild={visible} transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}>
      <box cssName="wired" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
        <label cssName="header" label="Wired" hexpand halign={Gtk.Align.START} />
        <box cssName="device" spacing={8}>
          <label label="󰀂" />
          <label label={iface.as(i => i || "Unknown")} />
        </box>
      </box>
    </revealer>
  )
}

function NetworkColumn() {
  const enabled = createBinding(network.wifi, "enabled")
  const accessPoints = createBinding(network.wifi, "accessPoints")

  return (
    <box cssName="wifi" orientation={Gtk.Orientation.VERTICAL} spacing={8} widthRequest={250}>
      <WiredSection />

      <box spacing={8}>
        <label cssName="header" label="WiFi" hexpand halign={Gtk.Align.START} />
        <With value={enabled}>
          {
            (on) => <switch
              active={on}
              class={on ? "on" : "off"}
              onNotifyActive={() => network.wifi.set_enabled(!network.wifi.enabled)}
            />
          }
        </With>
      </box>

      <scrolledwindow maxContentHeight={200} hscrollbarPolicy={Gtk.PolicyType.NEVER} propagateNaturalHeight propagateNaturalWidth>
        <With value={enabled}>
          {(on) => on ?
            <DeviceList items={accessPoints} renderItem={(ap) => <WiFiDeviceRow accessPoint={ap} />} />
            : <label cssName="disabled" label="WiFi disabled" />}
        </With>
      </scrolledwindow>
    </box>
  )
}

function BluetoothColumn() {
  const powered = createBinding(bluetooth, "is_powered")
  const devices = createBinding(bluetooth, "devices")

  return (
    <box cssName="bluetooth" orientation={Gtk.Orientation.VERTICAL} spacing={8} widthRequest={250}>
      <box spacing={8}>
        <label cssName="header" label="Bluetooth" hexpand halign={Gtk.Align.START} />
        {adapter ?
          <With value={powered}>
            {
              (on) =>
                <switch
                  active={on}
                  class={on ? "on" : "off"}
                  onNotifyActive={() => {
                    if (adapter.powered) {
                      if (adapter.discovering) adapter.stop_discovery()
                      adapter.set_powered(false)
                    } else {
                      adapter.set_powered(true)
                      adapter.start_discovery()
                    }
                  }}
                />
            }
          </With>
          : <label cssName="error" label="N/A" />
        }
      </box>

      <scrolledwindow maxContentHeight={200} hscrollbarPolicy={Gtk.PolicyType.NEVER} propagateNaturalHeight propagateNaturalWidth>
        <With value={powered}>
          {(on) => on && adapter ?
            <DeviceList items={devices} renderItem={(device) => <BluetoothDeviceRow device={device} />} />
            : <label cssName="disabled" label="Bluetooth disabled" />}
        </With>
      </scrolledwindow>
    </box>
  )
}

function DeviceList<T>({
  items,
  renderItem
}: {
  items: Accessor<T[]>
  renderItem: (item: T) => JSX.Element
}) {
  return (
    <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
      <For each={items}>
        {(item) => renderItem(item)}
      </For>
    </box>
  )
}

function WiFiDeviceRow({ accessPoint }: { accessPoint: AstalNetwork.AccessPoint }) {
  const connected = createBinding(network, "wifi", "active_access_point")
    .as(a => a ? a.get_bssid() === accessPoint.get_bssid() : false)
  const strength = createBinding(accessPoint, "strength")
  const name = accessPoint.get_ssid() || accessPoint.get_bssid()
  const frequency = accessPoint.get_frequency()


  return (
    <Button
      cssName="device"
      class={connected.as(c => c ? "connected" : "")}
      onLeftClick={() => accessPoint.activate(null, () => { })}>
      <box spacing={8}>
        <label label={strength.as(getWiFiIcon)} />
        <label
          label={name}
          tooltipText={name}
          maxWidthChars={15}
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          hexpand
        />
        <label cssName="frequency" label={getWiFiFrequencyIcon(frequency)} />
        <label label={accessPoint.requires_password ? "" : ""} halign={Gtk.Align.END} />
      </box>
    </Button>
  )
}

function BluetoothDeviceRow({ device }: { device: AstalBluetooth.Device }) {
  const connected = createBinding(device, "connected")
  const paired = createBinding(device, "paired")
  const name = device.name || device.alias

  return (
    <Button
      cssName="device"
      class={connected.as(c => c ? "connected" : "")}
      onLeftClick={() => {
        if (connected()) {
          device.disconnect_device(() => { })
        } else if (paired()) {
          device.connect_device(() => { })
        } else {
          adapter?.set_pairable(true)
          device.pair()
          adapter?.set_pairable(false)
        }
      }}
    >
      <box spacing={8}>
        <label label={getBluetoothIcon(device.icon)} />
        <label
          label={name}
          tooltipText={name}
          maxWidthChars={20}
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          hexpand
        />
        <label label={paired.as(p => p ? "" : "")} halign={Gtk.Align.END} />
      </box>
    </Button>
  )
}


function getWiFiFrequencyIcon(frequency: number) {
  const f = Math.floor(frequency / 100)
  return `${f / 10}G`
}

function getWiFiIcon(strength: number) {
  if (strength >= 80) return "󰤨"
  if (strength >= 60) return "󰤥"
  if (strength >= 40) return "󰤢"
  if (strength >= 20) return "󰤟"
  return "󰤯"
}

function getBluetoothIcon(icon: string) {
  const map: Record<string, string> = {
    "audio-headset": "",
    "audio-headphones": "",
    phone: "",
    computer: "",
  }
  return map[icon] || ""
}

