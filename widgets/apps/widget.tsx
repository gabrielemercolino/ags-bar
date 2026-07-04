import { createBinding, For } from "ags"
import { Gtk } from "ags/gtk4"
import AstalTray from "gi://AstalTray"
import GLib from "gi://GLib"
import type { Widget } from "../registry"
import Button from "../../components/Button"
import { Notifications } from "./Notifications"
import type { NotificationsConfig } from "./Notifications"
import styles from "./styles.scss"

const tray = AstalTray.get_default()

type AppsConfig = {
  bg: string
  tray: { hover: { bg: string } }
  notifications: NotificationsConfig
}

export const widget = { render, css } satisfies Widget<AppsConfig>

function css(cfg: AppsConfig) {
  return {
    vars: {
      "--apps-bg": cfg.bg,
      "--tray-hover-bg": cfg.tray.hover.bg,
      "--notifications-fg": cfg.notifications.fg,
      "--notifications-popup-bg": cfg.notifications.popup.bg,
      "--notifications-popup-header-fg": cfg.notifications.popup.header.fg,
      "--notifications-popup-placeholder-fg": cfg.notifications.popup.placeholder.fg,
      "--notifications-popup-group-bg": cfg.notifications.popup.group.bg,
      "--notifications-popup-app-fg": cfg.notifications.popup.group.app.fg,
      "--notifications-popup-summary-fg": cfg.notifications.popup.group.summary.fg,
      "--notifications-popup-delete-fg": cfg.notifications.popup.group.delete.fg,
      "--notifications-popup-expand-fg": cfg.notifications.popup.group.expand.fg,
      "--notifications-osd-progress-fg": cfg.notifications.osd.progress.fg,
    },
    css: styles,
  }
}

function render({ notifications }: AppsConfig) {
  return (
    <box cssName="apps" spacing={2}>
      <Tray />
      <Notifications {...notifications} />
    </box>
  ) as Gtk.Widget
}

function Tray() {
  const items = createBinding(tray, "items")
    // filters a weird empty entry
    .as((its) => its.filter((it) => it.get_title() !== null))

  const visible = items(it => it.length > 0)

  return (
    <box cssName="tray" spacing={6} visible={visible}>
      <For each={items}>
        {(item) => <TrayItem item={item} />}
      </For>
    </box>
  )
}

type TrayItemProps = {
  item: AstalTray.TrayItem
}

function TrayItem({ item }: TrayItemProps) {
  const icon = createBinding(item, "gicon")
  const menuModel = createBinding(item, "menuModel")
  const actionGroup = createBinding(item, "actionGroup")
  const tooltipMarkup = createBinding(item, "tooltipMarkup")

  return (
    <box cssName="item-container">
      <Button
        cssName="item"
        tooltipMarkup={tooltipMarkup}
        onRightClick={(self) => {
          const mm = menuModel()
          const ag = actionGroup()
          if (mm) {
            const menu = Gtk.PopoverMenu.new_from_model(mm)
            if (ag) menu.insert_action_group("dbusmenu", ag)
            menu.set_parent(self)
            menu.popup()
            menu.connect("closed", () => {
              GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                menu.unparent()
                return GLib.SOURCE_REMOVE
              })
            })
          }
        }}
        onLeftClick={() => item.activate(0, 0)}
      >
        <image gicon={icon} />
      </Button>
    </box>
  )
}
