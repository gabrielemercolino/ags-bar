import { Accessor, createBinding, createComputed, createState } from "ags"
import { Gtk } from "ags/gtk4"
import AstalNetwork from "gi://AstalNetwork"
import Pango from "gi://Pango"
import { iconManager } from "../../managers/IconManager"
import { debounced } from "../../utils"
import { SectionHeader, SectionContent } from "./common"
import Button from "../../components/Button"

const wifi = AstalNetwork.get_default().get_wifi()

function startScanWithRetry(dev: AstalNetwork.Wifi, maxAttempts = 20) {
  let attempts = 0

  const id = setInterval(() => {
    attempts++
    if (!dev.enabled || dev.scanning || attempts >= maxAttempts) {
      clearInterval(id)
      return
    }
    try { dev.scan() } catch { }
  }, 500)
}

type WiFiControlsProps = {
  enabled: Accessor<boolean>
}

function WiFiControls({ enabled }: WiFiControlsProps) {
  if (!wifi)
    return <label cssName="error" label="N/A" />

  const scanning = createBinding(wifi, "scanning")

  return (
    <>
      <switch
        active={enabled}
        class={enabled.as(on => on ? "on" : "off")}
        onNotifyActive={(self) => {
          wifi.set_enabled(self.active)
          if (self.active) startScanWithRetry(wifi)
        }}
      />
      <Button
        class={scanning.as(s => s ? "scanning" : "")}
        sensitive={enabled.as(e => e && !scanning())}
        onLeftClick={() => { if (wifi.enabled && !wifi.scanning) wifi.scan() }}
      >
        <label label={iconManager.getGeneralIcon("refresh")} />
      </Button>
    </>
  )
}

type WiFiDeviceRowProps = {
  accessPoint: AstalNetwork.AccessPoint
  activeAp: Accessor<AstalNetwork.AccessPoint | null>
}

function WiFiDeviceRow({ accessPoint, activeAp }: WiFiDeviceRowProps) {
  const connected = activeAp.as(c => c?.get_bssid() === accessPoint.get_bssid() || false)
  const strength = createBinding(accessPoint, "strength")
  const name = accessPoint.get_ssid() || accessPoint.get_bssid()
  const frequencyLabel = `${Math.floor(accessPoint.get_frequency() / 100) / 10}G`

  return (
    <Button
      cssName="device"
      class={connected.as(c => c ? "connected" : "")}
      onLeftClick={() => accessPoint.activate(null, () => { })}>
      <box spacing={8}>
        <label label={strength.as(s => iconManager.getNetworkIcon({ type: "wifi", strength: s }))} />
        <label
          label={name}
          tooltipText={name}
          ellipsize={Pango.EllipsizeMode.END}
          halign={Gtk.Align.START}
          hexpand
        />
        <label cssName="frequency" label={frequencyLabel} />
      </box>
    </Button>
  )
}

export function WiFiSection() {
  const [expanded, setExpanded] = createState(false)

  const enabled = wifi
    ? createBinding(wifi, "enabled")
    : new Accessor(() => false)

  const debouncedEnabled = debounced(enabled, 150)

  const currentAP = wifi
    ? createBinding(wifi, "active_access_point")
    : new Accessor(() => null)

  const allAP = wifi
    ? createBinding(wifi, "access_points")
    : new Accessor(() => [])

  const sortedAP = createComputed(() =>
    (allAP() ?? []).toSorted((a, b) => {
      if (a === currentAP()) return -1
      if (b === currentAP()) return 1
      return b.strength - a.strength
    })
  )

  const shouldReveal = createComputed(() => expanded() && sortedAP().length > 0)

  return (
    <box cssName="section" orientation={Gtk.Orientation.VERTICAL}>
      <box cssName="header" spacing={8}>
        <SectionHeader title="WiFi" expanded={expanded} onToggle={() => setExpanded(!expanded.peek())} />
        <WiFiControls enabled={debouncedEnabled} />
      </box>

      <SectionContent show={shouldReveal} items={sortedAP}>
        {(ap) => <WiFiDeviceRow accessPoint={ap} activeAp={currentAP} />}
      </SectionContent>
    </box >
  )
}
