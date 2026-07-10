import { Accessor, createBinding, createComputed, createState } from "ags"
import { Gtk } from "ags/gtk4"
import AstalNetwork from "gi://AstalNetwork"
import GLib from "gi://GLib"
import NM from "gi://NM"
import Pango from "gi://Pango"
import { iconManager } from "../../managers/IconManager"
import { createLazyRoot, debounced } from "../../utils"
import { BarContext } from "../../BarContext"
import { WifiAuthOverlay, type WifiAuthOverlayConfig } from "./wifiAuthOverlay"
import { SectionHeader, SectionContent } from "./common"
import Button from "../../components/Button"

const network = AstalNetwork.get_default()
const wifi = network.get_wifi()
const nmClient = network.get_client()

type WifiSectionProps = {
  config: WifiAuthOverlayConfig
}

export function WiFiSection({ config }: WifiSectionProps) {
  const [expanded, setExpanded] = createState(false)

  const { monitor } = BarContext.use()
  const [getOverlay, destroyOverlay] = createLazyRoot(
    () => WifiAuthOverlay(monitor, config),
    (o) => o?.destroy()
  )

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
    <box cssName="section" orientation={Gtk.Orientation.VERTICAL} $={(self) => { self.connect("unrealize", destroyOverlay) }}>
      <box cssName="header" spacing={8}>
        <SectionHeader title="WiFi" expanded={expanded} onToggle={() => setExpanded(!expanded.peek())} />
        <WiFiControls enabled={debouncedEnabled} />
      </box>

      <SectionContent show={shouldReveal} items={sortedAP}>
        {(ap) => <WiFiDeviceRow accessPoint={ap} activeAp={currentAP} onPasswordRequired={(ssid, connect) => getOverlay().open(ssid, connect)} />}
      </SectionContent>
    </box >
  )
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
  onPasswordRequired?: (ssid: string, connect: (password: string, onSuccess: () => void, onFailure: () => void) => void) => void
}

function WiFiDeviceRow({ accessPoint, activeAp, onPasswordRequired }: WiFiDeviceRowProps) {
  const connected = activeAp.as(c => c?.get_bssid() === accessPoint.get_bssid() || false)
  const strength = createBinding(accessPoint, "strength")
  const name = accessPoint.get_ssid() || accessPoint.get_bssid()
  const frequencyLabel = `${Math.floor(accessPoint.get_frequency() / 100) / 10}G`

  return (
    <Button
      cssName="device"
      class={connected.as(c => c ? "connected" : "")}
      onLeftClick={() => {
        const profile = findProfileForAp(accessPoint)
        const isBssidPinned = profile?.get_setting_wireless()?.get_mac_address() != null
        const showPrompt = isSecured(accessPoint) && !profile

        if (showPrompt) {
          onPasswordRequired?.(name, (password, onSuccess) => {
            accessPoint.activate(password, () => { })
            onSuccess()
          })
        } else if (profile && !isBssidPinned) {
          nmClient.activate_connection_async(profile, wifi?.device ?? null, accessPoint.get_path(), null, (_client, result) => {
            nmClient.activate_connection_finish(result)
          })
        } else {
          accessPoint.activate(null, () => { })
        }
      }}>
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

function isSecured(ap: AstalNetwork.AccessPoint): boolean {
  return (ap.wpa_flags ?? 0) > 0 || (ap.rsn_flags ?? 0) > 0
}

function ssidToString(ssid: GLib.Bytes): string {
  return String.fromCharCode(...ssid.toArray())
}

function findProfileForAp(ap: AstalNetwork.AccessPoint): NM.RemoteConnection | null {
  const bssid = ap.get_bssid().toLowerCase()
  const ssid = ap.get_ssid()

  let ssidMatch: NM.RemoteConnection | null = null

  for (const conn of nmClient.get_connections()) {
    const wireless = conn.get_setting_wireless()
    if (!wireless) continue

    // Tier 1: BSSID match
    const connMac = wireless.get_mac_address()
    if (connMac && String(connMac).toLowerCase() === bssid) {
      const security = conn.get_setting_wireless_security()
      if (security || conn.get_setting_802_1x())
        return conn
    }

    // Tier 2: SSID fallback
    if (!connMac && ssid) {
      const connSsid = wireless.get_ssid()
      if (!connSsid || ssidToString(connSsid) !== ssid) continue
      const security = conn.get_setting_wireless_security()
      if (!security && !conn.get_setting_802_1x()) continue
      if (!hasStoredPassword(conn)) continue
      if (!ssidMatch)
        ssidMatch = conn
    }
  }

  return ssidMatch
}

function hasStoredPassword(conn: NM.RemoteConnection): boolean {
  const security = conn.get_setting_wireless_security()
  if (!security) return false

  const keyMgmt = security.get_key_mgmt()

  if (keyMgmt === "ieee8021x" || keyMgmt === "wpa-eap") {
    const ieee8021x = conn.get_setting_802_1x()
    if (!ieee8021x) return false
    return ieee8021x.get_password_flags() === NM.SettingSecretFlags.NONE
  }

  const flags = keyMgmt === "none"
    ? security.get_wep_key_flags()
    : security.get_psk_flags()

  return flags === NM.SettingSecretFlags.NONE
}

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
