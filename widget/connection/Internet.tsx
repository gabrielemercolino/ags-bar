import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { Accessor, createBinding, createComputed, createConnection, createState, For, With } from "ags"
import Gtk from "gi://Gtk?version=4.0"
import Pango from "gi://Pango"
import AstalTray from "gi://AstalTray?version=0.1"
import Button from "../../components/Button"
import { Gdk } from "ags/gtk4"

const network = AstalNetwork.get_default()

export default function Internet() {
  const connectivity = createBinding(network, "primary")

  const state = connectivity.as(c => {
    if (c === AstalNetwork.Primary.WIFI) return "wifi"
    if (c === AstalNetwork.Primary.WIRED) return "wired"
    return "offline"
  })

  return (
    <menubutton
      cssName="internet"
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <With value={state}>
        {(state) => {
          if (state === "wifi") return <WiFiWidget />
          if (state === "wired") return <WiredWidget />
          else return <label label="󰖪" tooltipText="offline" />
        }}
      </With>

      <popover
        cssName="pop-up"
        onShow={() => {
          if (
            state() == "wifi" &&
            network.wifi.enabled &&
            !network.wifi.scanning
          )
            network.wifi.scan()
        }}
      >
        <With value={state}>
          {(state) => {
            if (state == "wired") return <WiredPopover />
            return <WiFiPopover />
          }}
        </With>
      </popover>
    </menubutton>
  )
}

function WiFiWidget() {
  const strength = createBinding(network.wifi, "strength")
  const ssid = createBinding(network.wifi, "ssid")

  const state = createComputed(() => ({
    strength: strength(),
    icon: getWiFiIcon(strength()),
    ssid: ssid(),
  }))

  return (
    <box>
      <With value={state}>
        {(state) => (
          <label
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
        {(name) => <label label="󰀂" tooltipText={name} />}
      </With>
    </box>
  )
}

function WiFiPopover() {
  const powered = createBinding(network.wifi, "enabled")
  const devices = createBinding(network.wifi, "accessPoints")

  return (
    <box
      cssName="container"
      orientation={Gtk.Orientation.VERTICAL}
      spacing={12}
    >
      <box cssName="header" spacing={8}>
        <label label="WiFi" hexpand halign={Gtk.Align.START} />

        <With value={powered}>
          {(powered) =>
            <switch
              halign={Gtk.Align.END}
              active={powered}
              class={powered ? "on" : "off"}
              onNotifyActive={() => {
                if (network.wifi.enabled) {
                  network.wifi.set_enabled(false)
                } else {
                  network.wifi.set_enabled(true)
                  if (!network.wifi.scanning) network.wifi.scan()
                }
              }}
            />
          }
        </With>
      </box>

      <scrolledwindow
        visible={powered}
        hscrollbarPolicy={Gtk.PolicyType.NEVER}
        maxContentHeight={400}
        propagateNaturalHeight
        propagateNaturalWidth
      >
        <box cssName="wifi-devices">
          <box
            cssName="container"
            orientation={Gtk.Orientation.VERTICAL}
            spacing={4}
          >
            <For each={devices}>
              {(device) => <WiFiAccessPoint device={device} />}
            </For>
          </box>
        </box>
      </scrolledwindow>
    </box>
  )
}

type WiFiDeviceParams = {
  device: AstalNetwork.AccessPoint
}

function WiFiAccessPoint({ device }: WiFiDeviceParams) {
  const strength = createBinding(device, "strength")

  const known =
    network
      .wifi
      .device
      .availableConnections
      .find(c => c.get_id() === device.ssid) !== undefined

  return (
    <Button
      cssName="device"
      //TODO: add class for active accessPoint
      onClicked={() => {
        if (known) device.activate(null, (accessPoint) => {
          if (accessPoint)
            console.log("connected to", accessPoint.bssid, getWiFiFrequencyIcon(accessPoint.frequency))
          else
            console.error("failed to connect")
        })
        else console.error("not known") //TODO: ask for password
      }}
    >
      <box spacing={8}>
        <label
          tooltipText={strength.as(s => `${s}%`)}
          cssName="icon"
          label={getWiFiIcon(device.strength)}
        />

        <label
          cssName="name"
          label={device.ssid ?? device.bssid}
          tooltipText={device.ssid ?? device.bssid}
          hexpand
          halign={Gtk.Align.START}
          maxWidthChars={20}
          ellipsize={Pango.EllipsizeMode.END}
        />

        <label
          cssName="frequency"
          label={getWiFiFrequencyIcon(device.frequency)}
        />

        <label
          cssName="lock-icon"
          label={getWiFiPasswordIcon(device)}
          tooltipText={known ? "known" : device.requires_password ? "requires password" : "free"}
        />
      </box>
    </Button>
  )
}

function WiredPopover() {
  const name = createBinding(network.wired.device, "interface")

  return (
    <box
      cssName="container"
      orientation={Gtk.Orientation.VERTICAL}
      spacing={12}
    >
      <box cssName="header"><label label="Wired" hexpand /></box>
      <box cssName="wired-device">
        <label label="󰀂" halign={Gtk.Align.START} hexpand />
        <label label={name} halign={Gtk.Align.END} />
      </box>
    </box>
  )
}

function getWiFiIcon(strength: number) {
  if (strength >= 80) return "󰤨"
  if (strength >= 60) return "󰤥"
  if (strength >= 40) return "󰤢"
  if (strength >= 20) return "󰤟"
  return "󰤯"
}

function getWiFiFrequencyIcon(frequency: number) {
  const f = Math.floor(frequency / 100)
  return `${f / 10}G`
}

function getWiFiPasswordIcon(device: AstalNetwork.AccessPoint) {
  if (!device.requires_password) return ""

  const known =
    network
      .wifi
      .device
      .availableConnections
      .find(c => c.get_id() === device.ssid) !== undefined

  if (known) return ""
  return ""
}
