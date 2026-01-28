import { Gdk, Gtk } from "ags/gtk4"
import { With, createBinding, createState } from "ags"
import AstalNotifd from "gi://AstalNotifd?version=0.1"
import { NotificationsManager } from "./NotificationsManager"
import Button from "../../components/Button"
import Pango from "gi://Pango?version=1.0"

const manager = new NotificationsManager()

export default function Notifications() {
  return (
    <menubutton
      cssName="notifications"
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <popover cssName="pop-up" widthRequest={300}>
        <scrolledwindow
          hscrollbarPolicy={Gtk.PolicyType.NEVER}
          maxContentHeight={300}
          maxContentWidth={250}
          propagateNaturalHeight
        >
          <With value={manager.getTree()}>
            {
              (tree) => (
                <box orientation={Gtk.Orientation.VERTICAL} spacing={12} cssName="notifications-container">
                  {tree.size === 0 ? <label label="No notifications" cssName="placeholder" />
                    : Array.from(tree)
                      .map(([key, notifications]) => <NotificationGroup groupKey={key} notifications={notifications} />)
                  }
                </box>
              )
            }
          </With>
        </scrolledwindow>
      </popover>
      
    </menubutton>
  )
}

type NotificationGroupParams = {
  groupKey: string,
  notifications: Array<AstalNotifd.Notification>
}

function NotificationGroup({ groupKey, notifications }: NotificationGroupParams) {
  const [expanded, setExpanded] = createState(false)
  const first = notifications[0]

  const handleBodyClick = () => {
    first.get_actions().at(0)?.invoke()
    manager.dismiss(groupKey)
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
        <Button cssName="delete-button" onLeftClick={() => manager.dismiss(groupKey)} valign={Gtk.Align.START}></Button>
      </box>

      <Button onLeftClick={handleBodyClick} cssName="bodies-button">
        <With value={expanded}>
          {(isExpanded) => (
            <box orientation={Gtk.Orientation.VERTICAL} cssName="bodies" spacing={4}>
              {(isExpanded ? notifications : notifications.slice(-3)).map(n => (
                <NotificationBody notification={n} />
              ))}
            </box>
          )}
        </With>
      </Button>

      {notifications.length > 3 && (
        <Button
          onLeftClick={() => setExpanded(!expanded())}
          halign={Gtk.Align.START}
          cssName="expand-button"
        >
          <label label={expanded(e => e ? "" : "")} />
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

