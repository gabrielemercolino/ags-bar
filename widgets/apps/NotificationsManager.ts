import { Gtk } from "ags/gtk4";
import GObject from "ags/gobject";
import AstalNotifd from "gi://AstalNotifd";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import { getDataDir } from "../../utils";

type NotificationTree = Map<string, Array<AstalNotifd.Notification>>

class NotificationsManager extends GObject.Object {
  static {
    GObject.registerClass({
      Properties: {
        "tree": GObject.ParamSpec.jsobject("tree", "tree", "tree", GObject.ParamFlags.READABLE),
        "dnd": GObject.ParamSpec.boolean("dnd", "dnd", "dnd",
          GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE, false),
        "changed": GObject.ParamSpec.jsobject("changed", "changed", "changed",
          GObject.ParamFlags.READABLE),
      },
    }, this)
  }

  private readonly notifd = AstalNotifd.get_default()
  private _tree: NotificationTree = new Map()
  private idToKey = new Map<number, string>()
  private _dnd: boolean = false
  private _soundEnable: boolean = true
  private _soundFile: string = "sounds/notification.oga"
  private _soundVolume: number = 0.5
  private _media: Gtk.MediaFile | null = null
  private _soundFilePath: string | null = null
  private notifdHandlers: number[] = []

  constructor() {
    super()
    this.notifdHandlers.push(this.notifd.connect("notified", (_, id) => this.add(id)))
    this.notifdHandlers.push(this.notifd.connect("resolved", (_, id) => this.remove(id)))
  }

  get tree(): NotificationTree {
    return this._tree
  }

  get dnd(): boolean { return this._dnd }
  set dnd(v: boolean) {
    if (this._dnd === v) return
    this._dnd = v
    this.notify("dnd")
    this.notify("changed")
  }

  get changed(): boolean { return true }

  get soundEnable(): boolean { return this._soundEnable }
  set soundEnable(v: boolean) {
    if (this._soundEnable === v) return
    this._soundEnable = v
  }

  get soundFile(): string { return this._soundFile }
  set soundFile(v: string) {
    if (this._soundFile === v) return
    this._soundFile = v
  }

  get soundVolume(): number { return this._soundVolume }
  set soundVolume(v: number) {
    if (this._soundVolume === v) return
    this._soundVolume = v
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
    this.notify("changed")

    if (!this._dnd && this._soundEnable) this.playSound()
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
    this.notify("changed")
  }

  private playSound() {
    const raw = this._soundFile
    const path = raw.startsWith("/") ? raw : `${getDataDir()}/${raw}`

    if (!GLib.file_test(path, GLib.FileTest.IS_REGULAR)) {
      console.warn(`[Notifications] sound file not found: ${path}`)
      return
    }

    if (this._media && this._soundFilePath !== path) {
      this._media.pause()
      this._media.set_file(Gio.File.new_for_path(path))
      this._soundFilePath = path
    } else if (this._media === null) {
      this._media = Gtk.MediaFile.new_for_file(Gio.File.new_for_path(path))
      this._soundFilePath = path
    }

    if (this._media) {
      this._media.pause()
      this._media.seek(0)
      this._media.volume = this._soundVolume
      this._media.play()
    }
  }

  destroy() {
    this._media?.pause()
    this._media = null
    this._soundFilePath = null

    for (const id of this.notifdHandlers) {
      this.notifd.disconnect(id)
    }
    this.notifdHandlers = []
  }
}

export const notifications = new NotificationsManager()
