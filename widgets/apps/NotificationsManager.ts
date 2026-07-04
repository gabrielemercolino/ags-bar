import GObject from "ags/gobject";
import AstalNotifd from "gi://AstalNotifd";

type NotificationTree = Map<string, Array<AstalNotifd.Notification>>

class NotificationsManager extends GObject.Object {
  static {
    GObject.registerClass({
      Properties: {
        "tree": GObject.ParamSpec.jsobject("tree", "tree", "tree", GObject.ParamFlags.READABLE),
      },
    }, this)
  }

  private readonly notifd = AstalNotifd.get_default()
  private _tree: NotificationTree = new Map()
  private idToKey = new Map<number, string>()

  constructor() {
    super()
    this.notifd.connect("notified", (_, id) => this.add(id))
    this.notifd.connect("resolved", (_, id) => this.remove(id))
  }

  get tree(): NotificationTree {
    return this._tree
  }

  dismiss(key: string) {
    this._tree.get(key)?.forEach(n => n.dismiss())
  }

  private add(id: number) {
    const notification = this.notifd.get_notification(id)!
    const app = notification.get_app_name()
    const summary = notification.get_summary()
    const key = `${app}:${summary}`

    const tree = new Map(this._tree)
    const group = tree.get(key) || []
    tree.set(key, [...group, notification])

    this.idToKey.set(id, key)
    this._tree = tree
    this.notify("tree")
  }

  private remove(id: number) {
    const key = this.idToKey.get(id)
    if (key === undefined) return

    const tree = new Map(this._tree)
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
    this._tree = tree
    this.notify("tree")
  }
}

export const notifications = new NotificationsManager()
