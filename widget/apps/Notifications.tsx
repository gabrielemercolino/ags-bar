import { Gdk, Gtk } from "ags/gtk4"
import { createBinding, createState, For, With } from "ags"
import AstalNotifd from "gi://AstalNotifd?version=0.1"
import Pango from "gi://Pango?version=1.0"
import Button from "../../components/Button"
import { NotificationsManager } from "./NotificationsManager"

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
                <box orientation={Gtk.Orientation.VERTICAL}>
                  {
                    Array.from(tree.entries())
                      .map(([appName, summaries]) =>
                        <AppGroup appName={appName} summaries={summaries} />
                      )
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

type AppGroupProps = {
  appName: string
  summaries: Map<string, Array<AstalNotifd.Notification>>
}
function AppGroup({ appName, summaries }: AppGroupProps) {
  return (
    <box cssName="app-group" orientation={Gtk.Orientation.VERTICAL} spacing={8}>
      <box>
        <label cssName="app-name" label={appName} halign={Gtk.Align.START} hexpand />
        <Button cssName="dismiss-btn" onClicked={() => manager.dismissAllForApp(appName)}>
          󰆴
        </Button>
      </box>

      <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
        {Array.from(summaries.entries()).map(([summary, notifs]) => (
          <SummaryGroup app={appName} summary={summary} notifications={notifs} />
        ))}
      </box>
    </box>
  )
}

type SummaryGroupProps = {
  app: string
  summary: string
  notifications: Array<AstalNotifd.Notification>
}
function SummaryGroup({ app, summary, notifications }: SummaryGroupProps) {
  return (
    <box cssName="summary-group" orientation={Gtk.Orientation.VERTICAL} spacing={4}>
      <box>
        <label cssName="summary" label={summary} halign={Gtk.Align.START} hexpand />
        <Button cssName="dismiss-btn" onClicked={() => manager.dismissAllForSummary(app, summary)}>
          󰆴
        </Button>
      </box>

      <box
        cssName="bodies-container" orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        {notifications.map((notif) => (
          <NotificationBody
            notification={notif}
            onClick={() => {
              notif.get_actions().at(0)?.invoke()
              manager.dismissAllForSummary(app, summary)
            }}
          />
        ))}
      </box>
    </box>
  )
}

type NotificationBodyProps = {
  notification: AstalNotifd.Notification
  onClick: () => void
}
function NotificationBody({ notification, onClick }: NotificationBodyProps) {
  const body = notification.get_body()
  return (
    <button cssName="body" onClicked={onClick}>
      <label
        label={body}
        useMarkup={true}
        halign={Gtk.Align.START}
        wrap
        ellipsize={Pango.EllipsizeMode.END}
      />
    </button>
  )
}
