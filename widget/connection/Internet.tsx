import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { Accessor, createBinding, createComputed, For, With } from "ags"
import Gtk from "gi://Gtk?version=4.0"
import Pango from "gi://Pango"
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
        widthRequest={250}
        onShow={() => {
          if (network.wifi.enabled && !network.wifi.scanning)
            network.wifi.scan()
        }}
      >
        <box cssName="container" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
          <WiredPopover visible={state(s => s === "wired").peek()} />
          <WiFiPopover />
        </box>
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

type WiredPopoverParams = {
  visible: boolean
}
function WiredPopover({ visible }: WiredPopoverParams) {
  const name = visible ? createBinding(network.wired.device, "interface") : ""

  return (
    <box visible={visible} cssName="wired-popover" orientation={Gtk.Orientation.VERTICAL}>
      <box cssName="header">
        <label label="Wired" hexpand halign={Gtk.Align.START} />
      </box>
      <box cssName="body" spacing={8}>
        <label cssName="icon" label="󰀂" />
        <label cssName="name" label={name} />
      </box>
    </box>
  )
}


function WiFiPopover() {
  const enabled = createBinding(network.wifi, "enabled")

  return (
    <box cssName="wifi-popover" orientation={Gtk.Orientation.VERTICAL}>
      <box cssName="header">
        <label label="WiFi" hexpand halign={Gtk.Align.START} />
        <With value={enabled}>
          {
            (enabled) =>
              <switch
                active={enabled}
                class={enabled ? "on" : "off"}
                onNotifyActive={() => network.wifi.set_enabled(!network.wifi.enabled)}
              />
          }
        </With>
      </box>
      <box cssName="body">
        <scrolledwindow
          propagateNaturalWidth
          propagateNaturalHeight
          maxContentHeight={100}
          hscrollbarPolicy={Gtk.PolicyType.NEVER}
        >
          <With value={enabled}>
            {(enabled) => enabled ? <WiFiDevicesList /> : <label cssName="offline" label="WiFi is disabled" valign={Gtk.Align.START} />}
          </With>
        </scrolledwindow>
      </box>
    </box>
  )
}

function WiFiDevicesList() {
  const devices = createBinding(network.wifi, "accessPoints")

  return (
    <box spacing={8} orientation={Gtk.Orientation.VERTICAL}>
      <For each={devices}>
        {
          (device) => {
            const strength = createBinding(device, "strength")
            const name = createBinding(device, "ssid")

            return (
              <Button
                cssName="device"
                onLeftClick={(self) => connectToWiFi(self, device)}
              >
                <box spacing={8} hexpand>
                  <label cssName="icon" label={strength(s => getWiFiIcon(s))} />
                  <label cssName="name" label={name} tooltipText={name} halign={Gtk.Align.START} maxWidthChars={18} ellipsize={Pango.EllipsizeMode.END} hexpand />
                  <label cssName="frequency" label={getWiFiFrequencyIcon(device.get_frequency())} />
                  <label cssName="lock" label={getWiFiPasswordIcon(device)} />
                </box>
              </Button>
            )
          }
        }
      </For >
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

function connectToWiFi(widget: Gtk.Widget, device: AstalNetwork.AccessPoint) {
  console.log(
    "attempting to connect to:",
    device.get_ssid() ?? device.get_bssid(),
    getWiFiFrequencyIcon(device.get_frequency())
  )

  device.activate(null, () => {
    if (network.get_wifi()?.get_active_access_point() === null) {
      console.error("failed to connect")
      // TODO: create popup from widget for password and try again
    } else {
      console.log("connected successfully")
    }
  })
}
