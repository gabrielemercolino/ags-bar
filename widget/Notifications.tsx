import { Gtk } from "ags/gtk4"
import AstalNotifd from "gi://AstalNotifd?version=0.1"
import { createBinding, With } from "gnim"

const notifd = AstalNotifd.get_default()

// clear at startup
notifd.notifications.forEach((n) => n.dismiss())

export default function Notifications() {
  const notifications = createBinding(notifd, "notifications")

  const groupedNotifications = notifications.as((notifs) => {
    const groups = new Map<
      string,
      Map<string, Array<AstalNotifd.Notification>>
    >()

    // unfortunately they are not necessarily sorted
    const sorted = notifs.sort((a, b) => a.get_time() - b.get_time())

    for (const notif of sorted) {
      const app = notif.get_app_name()
      const summary = notif.get_summary()

      if (!groups.has(app)) groups.set(app, new Map())

      const appGroup = groups.get(app)!
      if (!appGroup.has(summary)) appGroup.set(summary, [])

      appGroup.get(summary)!.push(notif)
    }

    return groups
  })

  return (
    <menubutton cssName="notifications">
      <popover cssName="pop-up">
        <scrolledwindow
          hscrollbarPolicy={Gtk.PolicyType.NEVER}
          maxContentHeight={600}
          propagateNaturalHeight
        >
          <With value={groupedNotifications}>
            {(gn) => {
              return (
                <box orientation={Gtk.Orientation.VERTICAL}>
                  {Array.from(gn.entries()).map(([appName, summaries]) => (
                    <AppGroup appName={appName} summaries={summaries} />
                  ))}
                </box>
              )
            }}
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
        <label
          cssName="app-name"
          label={appName}
          halign={Gtk.Align.START}
          hexpand
        />
        <button
          cssName="dismiss-btn"
          onClicked={() =>
            summaries.forEach((s) => s.forEach((n) => n.dismiss()))
          }
        >
          󰆴
        </button>
      </box>

      <box orientation={Gtk.Orientation.VERTICAL} spacing={6}>
        {Array.from(summaries.entries()).map(([summary, notifs]) => (
          <SummaryGroup summary={summary} notifications={notifs} />
        ))}
      </box>
    </box>
  )
}

type SummaryGroupProps = {
  summary: string
  notifications: Array<AstalNotifd.Notification>
}
function SummaryGroup({ summary, notifications }: SummaryGroupProps) {
  return (
    <box
      cssName="summary-group"
      orientation={Gtk.Orientation.VERTICAL}
      spacing={4}
    >
      <box>
        <label
          cssName="summary"
          label={summary}
          halign={Gtk.Align.START}
          hexpand
        />
        <button
          cssName="dismiss-btn"
          onClicked={() => notifications.forEach((n) => n.dismiss())}
        >
          󰆴
        </button>
      </box>

      <box
        cssName="bodies-container"
        orientation={Gtk.Orientation.VERTICAL}
        spacing={2}
      >
        {notifications.map((notif) => (
          <NotificationBody
            notification={notif}
            onClick={() => {
              notif.get_actions().at(0)?.invoke()
              notifications.forEach((n) => n.dismiss())
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
  const maxChars = 60
  const truncated =
    body.length > maxChars ? body.substring(0, maxChars) + "..." : body
  return (
    <button cssName="body" onClicked={onClick}>
      <label label={truncated} useMarkup={true} halign={Gtk.Align.START} wrap />
    </button>
  )
}
