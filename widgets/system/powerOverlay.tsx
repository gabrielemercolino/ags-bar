import { Astal, Gdk, Gtk } from "ags/gtk4"
import Button from "../../components/Button"
import { exec } from "ags/process"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

type PowerConfig = {
  shutdown: string
  reboot: string
  lock: string
  logout: string
}

export function PowerOverlay(monitor: Gdk.Monitor, config: PowerConfig) {
  const { shutdown, reboot, lock, logout } = config
  let buttonsBox: Gtk.Widget | null = null

  const close = () => { win?.set_visible(false) }
  const open = () => { win?.set_visible(true) }
  const toggle = () => { win?.visible ? close() : open() }
  const destroy = () => { win?.destroy(); win = null }

  const execAndClose = (command: string) => { exec(command); close() }

  let win = (
    <window
      visible={false}
      gdkmonitor={monitor}
      cssName="power-overlay"
      layer={Astal.Layer.OVERLAY}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.EXCLUSIVE}
      $={(self) => {
        const controller = new Gtk.EventControllerKey()
        controller.connect("key-pressed", () => close())
        self.add_controller(controller)
      }}
    >
      <box
        hexpand vexpand
        cssName="container"
        $={(self) => {
          const gesture = new Gtk.GestureClick()
          gesture.connect("pressed", (_g, _n, x, y) => {
            if (!buttonsBox) {
              close()
              return
            }
            const a = buttonsBox.get_allocation()
            if (!a.contains_point(x, y))
              close()
          })
          self.add_controller(gesture)
        }}
      >
        <box
          hexpand vexpand
          cssName="button-area"
          halign={Gtk.Align.CENTER}
          valign={Gtk.Align.CENTER}
          $={(self) => { buttonsBox = self }}
          spacing={30}
        >
          <Button cssName="shutdown" tooltipText="Shutdown" onLeftClick={() => execAndClose(shutdown)}>󰐥</Button>
          <Button cssName="reboot" tooltipText="Reboot" onLeftClick={() => execAndClose(reboot)}>󰜉</Button>
          <Button cssName="lock" tooltipText="Lock" onLeftClick={() => execAndClose(lock)}>󰌾</Button>
          <Button cssName="logout" tooltipText="Logout" onLeftClick={() => execAndClose(logout)}>󰍃</Button>
        </box>
      </box>
    </window>
  ) as Astal.Window | null

  return { open, close, toggle, destroy }
}
