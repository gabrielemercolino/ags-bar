import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import { createBinding, For, With } from "gnim"
import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import Pango from "gi://Pango?version=1.0"

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
              : wired.get().get_internet() != AstalNetwork.Internet.DISCONNECTED
                ? createBinding(wired.get(), "device").as((d) => d.interface)
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
    <menubutton cssName="bluetooth">
      <label label={on.as((on) => (on ? " on" : " off"))} />

      <popover
        onClosed={() => {
          const adapter = bluetooth.get_adapter()
          if (adapter?.discovering) adapter.stop_discovery()
        }}
        onShow={() => {
          const adapter = bluetooth.get_adapter()
          if (adapter?.powered && !adapter?.discovering)
            adapter.start_discovery()
        }}
      >
        <box orientation={Gtk.Orientation.VERTICAL} spacing={12}>
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
  const adapter = bluetooth.get_adapter()

  if (!adapter)
    return (
      <box cssName="bluetooth-header">
        <label label="No bluetooth adapter avaible" />
      </box>
    )

  const powered = createBinding(adapter, "powered")

  return (
    <box cssName="bluetooth-header" spacing={8}>
      <label label="Bluetooth" hexpand halign={Gtk.Align.START} />

      <With value={powered}>
        {(powered) => (
          <switch
            active={powered}
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
        <box cssName="devices-list">
          <label visible={empty} label="No devices found" />

          <box
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
      onClicked={() => {
        if (connected.get()) device.disconnect_device(console.log)
        else if (paired.get()) device.connect_device(console.log)
        else
          execAsync(`bluetoothctl pair ${device.address}`) // using cli because the pair method hangs
            .catch(console.error)
      }}
    >
      <box spacing={8}>
        <label cssName="icon" label={getDeviceIcon(device)} />

        <label
          cssName="name"
          class={`${connected.as((c) => (c ? "connected" : ""))}`}
          label={device.get_name() ?? device.get_alias()}
          hexpand
          halign={Gtk.Align.START}
          maxWidthChars={20}
          ellipsize={Pango.EllipsizeMode.END}
        />

        <label label={paired.as((p) => (p ? "" : ""))} />
      </box>
    </button>
  )
}

function getDeviceIcon(device: AstalBluetooth.Device): string {
  const icon = device.get_icon() || ""
  const iconMap: Record<string, string> = {
    "audio-headset": "",
    "audio-headphones": "",
    "audio-card": "󱀞",
    phone: "",
    computer: "",
    "input-keyboard": "",
    "input-mouse": "󰦋",
  }
  return iconMap[icon] || " "
}
