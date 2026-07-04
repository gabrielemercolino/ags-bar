import { Accessor, createBinding, createComputed, createState } from "ags"
import { Gtk } from "ags/gtk4"
import AstalBluetooth from "gi://AstalBluetooth"
import Pango from "gi://Pango"
import { iconManager } from "../../managers/IconManager"
import { SectionHeader, SectionContent } from "./common"
import Button from "../../components/Button"

const bluetooth = AstalBluetooth.get_default()
const adapter = bluetooth?.get_adapter()

type BluetoothControlsProps = {
  powered: Accessor<boolean>
}

function BluetoothControls({ powered }: BluetoothControlsProps) {
  if (!adapter)
    return <label cssName="error" label="N/A" />

  const discovering = createBinding(adapter, "discovering")

  return (
    <>
      <switch
        active={powered}
        class={powered.as(on => on ? "on" : "off")}
        onNotifyActive={(self) => {
          if (self.active) {
            adapter.set_powered(true)
            adapter.start_discovery()
          } else {
            if (adapter.discovering) adapter.stop_discovery()
            adapter.set_powered(false)
          }
        }}
      />
      <Button
        class={discovering.as(d => d ? "scanning" : "")}
        sensitive={powered.as(p => p && !discovering())}
        onLeftClick={() => { if (powered.peek() && !adapter.discovering) adapter.start_discovery() }}
      >
        <label label={iconManager.getGeneralIcon("refresh")} />
      </Button>
    </>
  )
}

type BluetoothDeviceRowProps = {
  device: AstalBluetooth.Device
}

function BluetoothDeviceRow({ device }: BluetoothDeviceRowProps) {
  const connected = createBinding(device, "connected")
  const paired = createBinding(device, "paired")
  const deviceName = createBinding(device, "name")
  const alias = createBinding(device, "alias")
  const name = createComputed(() => deviceName() || alias())

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
        <label label={iconManager.getBluetoothIcon({ deviceType: device.icon })} />
        <label
          label={name}
          tooltipText={name}
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          hexpand
        />
        <label label={paired.as(p => iconManager.getBluetoothIcon({ paired: p }))} halign={Gtk.Align.END} />
      </box>
    </Button>
  )
}

export function BluetoothSection() {
  const [expanded, setExpanded] = createState(false)

  const powered = bluetooth
    ? createBinding(bluetooth, "is_powered")
    : new Accessor(() => false)

  const devices = bluetooth
    ? createBinding(bluetooth, "devices")
    : new Accessor(() => [])

  const filteredDevices = createComputed(() => powered() ? devices() : [])
  const shouldReveal = createComputed(() => expanded() && filteredDevices().length > 0)

  return (
    <box cssName="section" orientation={Gtk.Orientation.VERTICAL}>
      <box cssName="header" spacing={8}>
        <SectionHeader title="Bluetooth" expanded={expanded} onToggle={() => setExpanded(!expanded.peek())} />
        <BluetoothControls powered={powered} />
      </box>

      <SectionContent show={shouldReveal} items={filteredDevices}>
        {(device) => <BluetoothDeviceRow device={device} />}
      </SectionContent>
    </box >
  )
}
