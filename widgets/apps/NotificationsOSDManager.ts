import GObject from "ags/gobject"
import AstalNotifd from "gi://AstalNotifd"
import GLib from "gi://GLib"
import { NotifOSDConfig } from "./NotificationsOSD"
import { notifications } from "./NotificationsManager"


export class OSDMessage extends GObject.Object {
  static {
    GObject.registerClass({
      Properties: {
        "progress": GObject.ParamSpec.jsobject("progress", "progress", "progress",
          GObject.ParamFlags.READABLE),
        "visible": GObject.ParamSpec.boolean("visible", "visible", "visible",
          GObject.ParamFlags.READABLE, false),
        "paused": GObject.ParamSpec.boolean("paused", "paused", "paused",
          GObject.ParamFlags.READABLE, false),
      },
    }, this)
  }

  id: number
  notification: AstalNotifd.Notification
  removing: boolean = false

  private _progress: number = 1
  private _visible: boolean = false
  private _paused: boolean = false
  private timeoutId: number | null = null
  private progressId: number | null = null
  private startTime: number = 0
  private remainingMs: number
  private readonly duration: number
  private readonly onTimeout: (id: number) => void

  constructor(id: number, notification: AstalNotifd.Notification, duration: number, onTimeout: (id: number) => void) {
    super()
    this.id = id
    this.notification = notification
    this.duration = duration
    this.remainingMs = duration
    this.onTimeout = onTimeout
  }

  get progress(): number { return this._progress }
  get visible(): boolean { return this._visible }
  get paused(): boolean { return this._paused }

  show() {
    this._visible = true
    this.notify("visible")
    this.startTime = GLib.get_monotonic_time() / 1000
    this.startDismissTimeout()
    this.startProgressInterval()
  }

  hide() {
    this._visible = false
    this.notify("visible")
    this.clearTimers()
  }

  pause() {
    if (this._paused) return
    this._paused = true
    this.notify("paused")

    this.remainingMs -= GLib.get_monotonic_time() / 1000 - this.startTime
    this.clearTimers()
  }

  resume() {
    if (!this._paused) return
    this._paused = false
    this.notify("paused")

    this.startTime = GLib.get_monotonic_time() / 1000
    this.startDismissTimeout()
    this.startProgressInterval()
  }

  destroy() {
    this.clearTimers()
  }

  private startDismissTimeout() {
    this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this.remainingMs, () => {
      this.onTimeout(this.id)
      return GLib.SOURCE_REMOVE
    })
  }

  private startProgressInterval() {
    this.progressId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
      if (this._paused) return GLib.SOURCE_CONTINUE
      const elapsed = GLib.get_monotonic_time() / 1000 - this.startTime
      const remaining = Math.max(0, this.remainingMs - elapsed)
      this._progress = this.duration > 0 ? remaining / this.duration : 0
      this.notify("progress")
      return GLib.SOURCE_CONTINUE
    })
  }

  private clearTimers() {
    if (this.timeoutId !== null) {
      GLib.source_remove(this.timeoutId)
      this.timeoutId = null
    }
    if (this.progressId !== null) {
      GLib.source_remove(this.progressId)
      this.progressId = null
    }
  }
}

export class NotificationsOSDManager extends GObject.Object {
  static {
    GObject.registerClass({
      Properties: {
        "list": GObject.ParamSpec.jsobject("list", "list", "list", GObject.ParamFlags.READABLE),
      },
    }, this)
  }

  private readonly notifd = AstalNotifd.get_default()
  private _list: OSDMessage[] = []
  private config: NotifOSDConfig
  private nextId = 0

  get list(): OSDMessage[] {
    return this._list
  }

  constructor(config: NotifOSDConfig) {
    super()
    this.config = config

    this.notifd.connect("notified", (_src, id: number) => {
      const notification = this.notifd.get_notification(id)
      if (notification) this.add(notification)
    })

    this.notifd.connect("resolved", (_src, id: number) => {
      for (const entry of this._list) {
        if (entry.notification.get_id() === id) {
          this.remove(entry.id, false)
          return
        }
      }
    })
  }

  private add(notification: AstalNotifd.Notification) {
    if (notifications.dnd) return

    if (this._list.length >= this.config.maxMessages) {
      const oldest = this._list[0].paused ? this._list[1] : this._list[0]
      oldest.hide()
      oldest.removing = true

      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
        oldest.destroy()
        this._list = this._list.filter(e => e.id !== oldest.id)
        this.addEntry(notification)
        return GLib.SOURCE_REMOVE
      })
      return
    }

    this.addEntry(notification)
  }

  private addEntry(notification: AstalNotifd.Notification) {
    const entry = new OSDMessage(this.nextId++, notification, this.config.duration, (id) => {
      this.remove(id, false)
    })
    this._list = [...this._list, entry]
    this.notify("list")
    GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
      entry.show()
      return GLib.SOURCE_REMOVE
    })
  }

  remove(id: number, immediate: boolean = false) {
    const entry = this._list.find(e => e.id === id)
    if (!entry || entry.removing) return
    entry.removing = true

    if (immediate) {
      this.removeFromList(entry)
    } else {
      entry.hide()
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
        if (this._list.includes(entry)) {
          this.removeFromList(entry)
        }
        return GLib.SOURCE_REMOVE
      })
    }
  }

  private removeFromList(entry: OSDMessage) {
    entry.destroy()
    this._list = this._list.filter(e => e.id !== entry.id)
    this.notify("list")
  }

  destroy() {
    for (const entry of this._list) {
      entry.destroy()
    }
    this._list = []
    this.notify("list")
  }
}
