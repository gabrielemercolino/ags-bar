import { createBinding, For } from "ags"
import { Gtk } from "ags/gtk4"
import AstalTray from "gi://AstalTray"
import GLib from "gi://GLib"
import type { Widget } from "../registry"
import Button from "../../components/Button"
import { Notifications } from "./Notifications"
import styles from "./styles.scss"

const trayService = AstalTray.get_default()

type AppsConfig = {
  bg: string
  tray: { hover: { bg: string } }
  notifications: {
    hover: { bg: string }
    popup: {
      bg: string
      group: {
        bg: string
        app: { fg: string }
        summary: { fg: string }
        delete: { fg: string }
        expand: { fg: string }
      }
    }
  }
}

export const widget = { render, css } satisfies Widget<AppsConfig>

function css(cfg: AppsConfig) {
  return {
    vars: {
      "--apps-bg": cfg.bg,
      "--tray-hover-bg": cfg.tray.hover.bg,
      "--notifications-hover-bg": cfg.notifications.hover.bg,
      "--notifications-popup-bg": cfg.notifications.popup.bg,
      "--notifications-group-bg": cfg.notifications.popup.group.bg,
      "--notifications-app-fg": cfg.notifications.popup.group.app.fg,
      "--notifications-summary-fg": cfg.notifications.popup.group.summary.fg,
      "--notifications-delete-fg": cfg.notifications.popup.group.delete.fg,
      "--notifications-expand-fg": cfg.notifications.popup.group.expand.fg,
    },
    css: styles,
  }
}

function render({ }: AppsConfig) {
  return (
    <box cssName="apps" spacing={2}>
      <Tray />
      <Notifications />
    </box>
  ) as Gtk.Widget
}

function Tray() {
  const items = createBinding(trayService, "items")
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
