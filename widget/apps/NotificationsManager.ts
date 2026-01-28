import AstalNotifd from "gi://AstalNotifd?version=0.1";
import { Accessor, createState } from "ags";

type NotificationTree = Map<string, Array<AstalNotifd.Notification>>

export class NotificationsManager {
  private readonly notifd = AstalNotifd.get_default()

  private tree = createState<NotificationTree>(new Map())
  private idToKey = new Map<number, string>()

  constructor() {
    this.notifd.connect("notified", (_, id) => this.add(id))
    this.notifd.connect("resolved", (_, id) => this.remove(id))
  }

  getTree(): Accessor<NotificationTree> {
    return this.tree[0]
  }

  dismiss(key: string) {
    this.tree[0]().get(key)?.forEach(n => n.dismiss())
  }

  private add(id: number) {
    const notification = this.notifd.get_notification(id)!
    const app = notification.get_app_name()
    const summary = notification.get_summary()
    const key = `${app}:${summary}`

    const [getTree, setTree] = this.tree
    const tree = new Map(getTree())

    const group = tree.get(key) || []
    tree.set(key, [...group, notification])

    this.idToKey.set(id, key)
    setTree(tree)
  }

  private remove(id: number) {
    const key = this.idToKey.get(id)
    if (key === undefined) return

    const [getTree, setTree] = this.tree
    const tree = new Map(getTree())

    const notifications = tree.get(key)
    if (!notifications) {
      this.idToKey.delete(id)
      return
    }

    const filtered = notifications.filter(n => n.get_id() !== id)
    if (filtered.length === 0) {
      tree.delete(key)
    } else {
      tree.set(key, filtered)
    }

    this.idToKey.delete(id)
    setTree(tree)
  }
}
