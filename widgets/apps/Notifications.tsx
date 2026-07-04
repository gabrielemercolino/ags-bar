import { createBinding, createState, For } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import AstalNotifd from "gi://AstalNotifd"
import Pango from "gi://Pango"
import { iconManager } from "../../managers/IconManager"
import Button from "../../components/Button"
import { notifications } from "./NotificationsManager"
import AnimatedScrolledWindow from "../../components/AnimatedScrolledWindow"

let popupRef: Gtk.Popover | null = null

export function Notifications() {
  const groups = createBinding(notifications, "tree").as(t => Array.from(t))
  const showPlaceholder = createBinding(notifications, "tree").as(t => t.size === 0)
  const showGroups = showPlaceholder.as(p => !p)

  return (
    <menubutton
      cssName="notifications"
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <popover cssName="pop-up" widthRequest={300} $={(self) => { popupRef = self }}>
        <AnimatedScrolledWindow
          trigger={groups}
          hscrollbarPolicy={Gtk.PolicyType.NEVER}
          maxContentHeight={300}
          maxContentWidth={250}
          propagateNaturalHeight
        >
          <box orientation={Gtk.Orientation.VERTICAL} spacing={12} cssName="notifications-container">
            <label label="No notifications" cssName="placeholder" visible={showPlaceholder} />
            <box orientation={Gtk.Orientation.VERTICAL} spacing={12} visible={showGroups}>
              <For each={groups}>
                {([key, notifs]) => <NotificationGroup groupKey={key} notifications={notifs} />}
              </For>
            </box>
          </box>
        </AnimatedScrolledWindow>
      </popover>
      {iconManager.getNotificationsIcon("bell")}
    </menubutton>
  )
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

type NotificationBodyParams = {
  notification: AstalNotifd.Notification
}

function NotificationBody({ notification }: NotificationBodyParams) {
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
