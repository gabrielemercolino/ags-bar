import { Gtk } from "ags/gtk4"
import Button from "../../components/Button"
import type { Widget } from "../registry"
import { PowerOverlay } from "./powerOverlay"

import { iconManager } from "../../managers/IconManager"
import styles from "./styles.scss"
import { createLazyRoot } from "../../utils"
import { BarContext } from "../../BarContext"

type SystemConfig = {
  os: string,
  commands: {
    shutdown: string,
    reboot: string,
    lock: string,
    logout: string
  },

  // css
  bg: string,
  fg: string,
  overlay: {
    backdrop: string,
    bg: string,
    shutdown: { fg: string },
    reboot: { fg: string },
    lock: { fg: string },
    logout: { fg: string }
  }
}

export const widget = { render, css } satisfies Widget<SystemConfig>

function css(cfg: SystemConfig) {
  return {
    vars: {
      "--system-bg": cfg.bg,
      "--system-fg": cfg.fg,
      "--system-overlay-backdrop": cfg.overlay.backdrop,
      "--system-overlay-bg": cfg.overlay.bg,
      "--system-overlay-shutdown-fg": cfg.overlay.shutdown.fg,
      "--system-overlay-reboot-fg": cfg.overlay.reboot.fg,
      "--system-overlay-lock-fg": cfg.overlay.lock.fg,
      "--system-overlay-logout-fg": cfg.overlay.logout.fg
    },
    css: styles
  }
}

function render({ os, commands }: SystemConfig) {
  const { monitor } = BarContext.use()

  const [power, destroyPower] = createLazyRoot(
    () => PowerOverlay(monitor, commands),
    (p) => p?.destroy()
  )

  const widget = (
    <box cssName="system">
      <Button onLeftClick={() => power().toggle()}>
        <label label={iconManager.getDistroIcon(os)} halign={Gtk.Align.CENTER} />
      </Button>
    </box>
  ) as Gtk.Widget

  widget.connect("unrealize", destroyPower)

  return widget
}
