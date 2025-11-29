import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import Pango from "gi://Pango?version=1.0"
import { createBinding, createComputed, For, With } from "ags"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"

const bluetooth = AstalBluetooth.get_default()
const adapter = bluetooth.get_adapter()

export default function Bluetooth() {
  const on = createBinding(bluetooth, "isPowered")
  const connected = createBinding(bluetooth, "is_connected")

  const both = createComputed([on, connected], (o, c) => ({
    on: o,
    connected: c,
  }))

  return (
    <menubutton cssName="bluetooth">
      <label
        label={both.as(({ on, connected }) =>
          connected ? "󰂱" : on ? "" : "󰂲",
        )}
      />

      <popover
        cssName="pop-up"
        onClosed={() => {
          if (adapter?.discovering) adapter.stop_discovery()
        }}
        onShow={() => {
          if (adapter?.powered && !adapter?.discovering)
            adapter.start_discovery()
        }}
      >
        <box
          cssName="container"
          orientation={Gtk.Orientation.VERTICAL}
          spacing={12}
        >
          <BluetoothHeader />
          <scrolledwindow
            hscrollbarPolicy={Gtk.PolicyType.NEVER}
            maxContentHeight={400}
            propagateNaturalHeight
            propagateNaturalWidth
          >
            <BluetoothDevicesList />
          </scrolledwindow>
        </box>
      </popover>
    </menubutton>
  )
}

function BluetoothHeader() {
  if (!adapter)
    return (
      <box cssName="header">
        <label label="No bluetooth adapter avaible" />
      </box>
    )

  const powered = createBinding(adapter, "powered")

  return (
    <box cssName="header" spacing={8}>
      <label label="Bluetooth" hexpand halign={Gtk.Align.START} />

      <With value={powered}>
        {(powered) => (
          <switch
            halign={Gtk.Align.END}
            active={powered}
            class={powered ? "on" : "off"}
            onNotifyActive={() => {
              if (adapter.powered) {
                if (adapter.discovering) adapter.stop_discovery()
                adapter.powered = false
              } else {
                adapter.powered = true
                adapter.start_discovery()
              }
            }}
          />
        )}
      </With>
    </box>
  )
}

function BluetoothDevicesList() {
  const devices = createBinding(bluetooth, "devices")
  const empty = devices.as((devices) => devices.length == 0)

  return (
    <With value={empty}>
      {(empty) => (
        <box cssName="devices">
          <label
            cssName="adapter-missing"
            visible={empty}
            label="No devices found"
          />

          <box
            cssName="container"
            visible={!empty}
            orientation={Gtk.Orientation.VERTICAL}
            spacing={4}
          >
            <For each={devices}>
              {(device) => <BluetoothDevice device={device} />}
            </For>
          </box>
        </box>
      )}
    </With>
  )
}

type BluetoothDeviceParams = {
  device: AstalBluetooth.Device
}

function BluetoothDevice({ device }: BluetoothDeviceParams) {
  const connected = createBinding(device, "connected")
  const paired = createBinding(device, "paired")

  return (
    <button
      cssName="device"
      class={connected.as((c) => (c ? "connected" : ""))}
      onClicked={() => {
        if (adapter && !adapter.powered) adapter.powered = true
        if (connected.get())
          device.disconnect_device(
            (device) =>
              device &&
              console.log("disconnected from", device.name ?? device.alias),
          )
        else if (paired.get())
          device.connect_device(
            (device) =>
              device &&
              console.log("connected to", device.name ?? device.alias),
          )
        else
          execAsync(`bluetoothctl pair ${device.address}`) // using cli because the pair method hangs
            .catch(console.error)
      }}
    >
      <box spacing={8}>
        <label
          tooltipText={device.icon ?? "unknown type"}
          cssName="icon"
          label={getDeviceIcon(device)}
        />

        <label
          cssName="name"
          label={device.name ?? device.alias}
          tooltipText={device.name ?? device.alias}
          hexpand
          halign={Gtk.Align.START}
          maxWidthChars={20}
          ellipsize={Pango.EllipsizeMode.END}
        />

        <With value={paired}>
          {(paired) => (
            <label
              cssName="paired-icon"
              tooltipText={paired ? "paired" : "unknown"}
              label={paired ? "" : ""}
            />
          )}
        </With>
      </box>
    </button>
  )
}

function getDeviceIcon(device: AstalBluetooth.Device): string {
  const icon = device.icon || ""
  const iconMap: Record<string, string> = {
    "audio-headset": "",
    "audio-headphones": "",
    "audio-card": "󱀞",
    phone: "",
    computer: "",
    "input-keyboard": "",
    "input-mouse": "󰦋",
  }
  return iconMap[icon] || ""
}
