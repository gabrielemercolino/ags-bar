import { createBinding, createState, For } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import AstalNotifd from "gi://AstalNotifd"
import Pango from "gi://Pango"
import { iconManager } from "../../managers/IconManager"
import Button from "../../components/Button"
import { notifications } from "./NotificationsManager"
import AnimatedScrolledWindow from "../../components/AnimatedScrolledWindow"
import { createLazyRoot } from "../../utils"
import { BarContext } from "../../BarContext"
import { NotificationsOSD, type NotifOSDConfig } from "./NotificationsOSD"

export type NotificationsConfig = {
  dnd: boolean,
  osd: NotifOSDConfig,
  sound: { enable: boolean; volume: number; file: string },

  // css
  fg: string,
  popup: {
    bg: string,
    header: { fg: string },
    placeholder: { fg: string },
    group: {
      bg: string,
      app: { fg: string },
      summary: { fg: string },
      delete: { fg: string },
      expand: { fg: string }
    }
  }
}

let popupRef: Gtk.Popover | null = null

export function Notifications({ dnd: defaultDND, osd, sound }: NotificationsConfig) {
  const { monitor } = BarContext.use()

  const [getOsd, destroyOsd] = createLazyRoot(
    () => NotificationsOSD(monitor, osd),
    (o) => o?.destroy()
  )
  if (!defaultDND) getOsd()

  notifications.dnd = defaultDND
  notifications.soundEnable = sound.enable
  notifications.soundFile = sound.file
  notifications.soundVolume = sound.volume

  const groups = createBinding(notifications, "tree").as(t => Array.from(t))
  const showPlaceholder = createBinding(notifications, "tree").as(t => t.size === 0)
  const showGroups = showPlaceholder.as(p => !p)
  const dnd = createBinding(notifications, "dnd")
  const barIcon = createBinding(notifications, "changed")
    .as(() =>
      iconManager.getNotificationsIcon(notifications.dnd ? "dnd" : notifications.tree.size > 0 ? "some" : "none")
    )

  const widget = (
    <menubutton
      cssName="notifications"
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <label cssName="icon" label={barIcon} />

      <popover cssName="pop-up" widthRequest={300} $={(self) => { popupRef = self }}>
        <AnimatedScrolledWindow
          trigger={groups}
          hscrollbarPolicy={Gtk.PolicyType.NEVER}
          maxContentHeight={300}
          maxContentWidth={250}
          propagateNaturalHeight
        >
          <box cssName="container" orientation={Gtk.Orientation.VERTICAL} spacing={6} >
            <box cssName="header" orientation={Gtk.Orientation.HORIZONTAL}>
              <label cssName="title" label="Notifications" hexpand halign={Gtk.Align.START} />
              <Button
                cssName="dnd-toggle"
                halign={Gtk.Align.END}
                onLeftClick={() => { notifications.dnd = !notifications.dnd }}
              >
                <label label={dnd.as(d => iconManager.getNotificationsIcon(d ? "dnd" : "none"))} />
              </Button>
            </box>
            <label label="Nothing happened" cssName="placeholder" visible={showPlaceholder} />
            <box orientation={Gtk.Orientation.VERTICAL} spacing={6} visible={showGroups}>
              <For each={groups}>
                {([key, notifs]) => <NotificationGroup groupKey={key} notifications={notifs} />}
              </For>
            </box>
          </box>
        </AnimatedScrolledWindow>
      </popover>
    </menubutton>
  ) as Gtk.Widget

  const dndHandler = notifications.connect("notify::dnd", () => notifications.dnd ? destroyOsd() : getOsd())

  widget.connect("unrealize", () => {
    notifications.disconnect(dndHandler)
    destroyOsd()
  })

  return widget
}

type NotificationGroupProps = {
  groupKey: string
  notifications: Array<AstalNotifd.Notification>
}

function NotificationGroup({ groupKey, notifications: notifs }: NotificationGroupProps) {
  const [expanded, setExpanded] = createState(false)
  const first = notifs[0]

  const handleBodyClick = () => {
    first.get_actions().at(0)?.invoke()
    notifications.dismiss(groupKey)
    popupRef?.popdown()
  }

  return (
    <box orientation={Gtk.Orientation.VERTICAL} cssName="notification-group">
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <box orientation={Gtk.Orientation.VERTICAL} hexpand halign={Gtk.Align.START}>
          <label
            label={first.get_app_name()}
            halign={Gtk.Align.START}
            cssName="app-name"
          />
          <label
            label={first.get_summary()}
            halign={Gtk.Align.START}
            cssName="summary"
          />
        </box>
        <Button
          cssName="delete-button"
          onLeftClick={() => notifications.dismiss(groupKey)}
          valign={Gtk.Align.START}
        >
          {iconManager.getGeneralIcon("close")}
        </Button>
      </box>

      <Button onLeftClick={handleBodyClick} cssName="bodies-button">
        <box orientation={Gtk.Orientation.VERTICAL} cssName="bodies" spacing={4}>
          <box visible={notifs.length > 3}>
            <revealer revealChild={expanded} transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}>
              {notifs.slice(0, -3).map(n => <NotificationBody notification={n} />)}
            </revealer>
          </box>
          {notifs.slice(-3).map(n => <NotificationBody notification={n} />)}
        </box>
      </Button>

      {notifs.length > 3 && (
        <Button
          onLeftClick={() => setExpanded(!expanded())}
          halign={Gtk.Align.START}
          cssName="expand-button"
        >
          <label label={expanded(e => e ? iconManager.getGeneralIcon("collapsedv") : iconManager.getGeneralIcon("expanded"))} />
        </Button>
      )}
    </box>
  )
}

type NotificationBodyProps = {
  notification: AstalNotifd.Notification
}

function NotificationBody({ notification }: NotificationBodyProps) {
  const image = createBinding(notification, "image")

  return (
    <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
      <image
        visible={image(i => !!i)}
        file={image}
        pixelSize={24}
        valign={Gtk.Align.START}
      />
      <label
        cssName="body"
        label={notification.get_body()}
        useMarkup
        halign={Gtk.Align.START}
        hexpand
        ellipsize={Pango.EllipsizeMode.END}
      />
    </box>
  )
}
