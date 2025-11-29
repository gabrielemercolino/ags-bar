import AstalNetwork from "gi://AstalNetwork?version=0.1"
import { createBinding, With } from "ags"

const network = AstalNetwork.get_default()

export default function Internet() {
  const wired = createBinding(network, "wired")
  const wifi = createBinding(network, "wifi")

  const name = wifi.as((wf) => {
    if (wf && wf.ssid) return `󰤨  ${wf.ssid}`
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
            wifi.get().ssid
              ? createBinding(wifi.get(), "strength").as((s) => `${s}%`)
              : wired.get().internet != AstalNetwork.Internet.DISCONNECTED
                ? createBinding(wired.get(), "device").as((d) => d.interface)
                : undefined
          }
        />
      )}
    </With>
  )
}
