import { createState } from "ags"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { iconManager } from "../../managers/IconManager"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
const { CENTER } = Gtk.Align

export type WifiAuthOverlayConfig = {
  bg: string,
  fg: string,
  backdrop: string,
  entry: { bg: string, fg: string },
  button: { bg: string, fg: string },
}

export function WifiAuthOverlay(monitor: Gdk.Monitor, { }: WifiAuthOverlayConfig) {
  let onConnect: ((password: string, onSuccess: () => void, onFailure: () => void) => void) | null = null
  let authArea: Gtk.Widget | null = null
  let ssidLabel: Gtk.Label
  let passwordEntry: Gtk.Entry

  const [errorText, setErrorText] = createState("")
  const [connecting, setConnecting] = createState(false)

  const close = () => { win?.set_visible(false) }
  const destroy = () => { win?.destroy(); win = null }

  const handleConnect = () => {
    const pw = passwordEntry.get_text()
    if (!pw) {
      setErrorText("Password required")
      return
    }
    setErrorText("")
    setConnecting(true)
    onConnect?.(pw,
      () => close(),
      () => { setErrorText("Wrong password"); setConnecting(false) }
    )
  }

  const open = (ssid: string, callback: (password: string, onSuccess: () => void, onFailure: () => void) => void) => {
    onConnect = callback
    ssidLabel.label = ssid
    setErrorText("")
    setConnecting(false)
    passwordEntry.set_text("")
    win?.set_visible(true)
    passwordEntry.grab_focus()
  }

  let win = (
    <window
      visible={false}
      gdkmonitor={monitor}
      cssName="wifi-auth-overlay"
      layer={Astal.Layer.OVERLAY}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      $={(self) => {
        const controller = new Gtk.EventControllerKey()
        controller.connect("key-pressed", (_c, keyval) => {
          if (keyval === Gdk.KEY_Escape) close()
          if (connecting.peek()) return false
          return Gdk.KEY_Return === keyval || Gdk.KEY_KP_Enter === keyval
        })
        controller.connect("key-released", (_c, keyval) => {
          if (connecting.peek()) return
          if (keyval === Gdk.KEY_Return || keyval === Gdk.KEY_KP_Enter) handleConnect()
        })
        self.add_controller(controller)
      }}
    >
      <box
        hexpand vexpand
        cssName="container"
        $={(self) => {
          const gesture = new Gtk.GestureClick()
          gesture.connect("pressed", (_g, _n, x, y) => {
            if (!authArea) return close()
            const alloc = authArea.get_allocation()
            if (!alloc.contains_point(x, y)) close()
          })
          self.add_controller(gesture)
        }}
      >
        <box
          hexpand vexpand
          cssName="auth-area"
          orientation={Gtk.Orientation.VERTICAL}
          spacing={12}
          halign={CENTER}
          valign={CENTER}
          $={(self) => { authArea = self }}
        >
          <label cssName="ssid" $={(self) => { ssidLabel = self }} />
          <entry cssName="password" visibility={false} placeholderText="Enter password" sensitive={connecting.as(c => !c)} $={(self) => { passwordEntry = self }} />
          <revealer
            revealChild={errorText.as(t => t !== "")}
            transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
            transitionDuration={200}
          >
            <label cssName="error" label={errorText} />
          </revealer>
          <box spacing={8} halign={CENTER}>
            <button cssName="cancel" onClicked={close} sensitive={connecting.as(c => !c)}>Cancel</button>
            <button
              cssName="connect"
              onClicked={handleConnect}
              sensitive={connecting.as(c => !c)}
              class={connecting.as(c => c ? "scanning" : "")}
            >
              <label label={connecting.as(c => c ? iconManager.getGeneralIcon("refresh") : "Connect")} />
            </button>
          </box>
        </box>
      </box>
    </window>
  ) as Astal.Window | null

  return { open, close, destroy }
}
