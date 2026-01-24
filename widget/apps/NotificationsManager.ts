import AstalNotifd from "gi://AstalNotifd?version=0.1";
import { Accessor, createState } from "ags";

type NotificationTree = Map<string, Map<string, Array<AstalNotifd.Notification>>>

export class NotificationsManager {
  private readonly notifd = AstalNotifd.get_default()

  private tree = createState<NotificationTree>(new Map())
  private idToSummary = new Map<number, { app: string, summary: string }>()

  constructor() {
    this.notifd.connect("notified", (_, id) => this.add(id))
    this.notifd.connect("resolved", (_, id) => this.remove(id))
  }

  getTree(): Accessor<NotificationTree> {
    return this.tree[0]
  }

  dismissAllForApp(app: string) {
    const tree = this.tree[0]()

    const appSummaries = tree.get(app)
    if (appSummaries === undefined) return

    appSummaries.forEach((s) => s.forEach(n => n.dismiss()))
  }

  dismissAllForSummary(app: string, summary: string) {
    const tree = this.tree[0]()

    const appSummaries = tree.get(app)
    if (appSummaries === undefined) return


    const notifications = appSummaries.get(summary)
    if (notifications === undefined) return

    notifications.forEach(n => n.dismiss())
  }

  private add(id: number) {
    const notification = this.notifd.get_notification(id)!
    const app = notification.get_app_name()
    const summary = notification.get_summary()

    const [getTree, setTree] = this.tree

    const tree = new Map(getTree())
    if (!tree.has(app)) tree.set(app, new Map())

    const appSummaries = tree.get(app)!
    if (!appSummaries.has(summary)) appSummaries.set(summary, [])

    appSummaries.get(summary)!.push(notification)
    this.idToSummary.set(id, { app: app, summary: summary })

    setTree(tree)
  }

  private remove(id: number) {
    const location = this.idToSummary.get(id)
    if (location === undefined) return

    const { app, summary } = location
    const [getTree, setTree] = this.tree

    const tree = new Map(getTree())

    const appSummaries = tree.get(app)
    if (appSummaries === undefined) {
      this.idToSummary.delete(id)
      return
    }

    const notifications = appSummaries.get(summary)
    if (notifications === undefined) {
      this.idToSummary.delete(id)
      return
    }

    const filtered = notifications.filter(n => n.get_id() !== id)
    if (filtered.length === 0)
      appSummaries.delete(summary)
    else
      appSummaries.set(summary, filtered)

    if (appSummaries.size === 0) tree.delete(app)

    setTree(tree)
  }
}
