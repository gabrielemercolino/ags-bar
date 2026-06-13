import { monitorFile } from "ags/file"
import { exec } from "ags/process"

import Gio from "gi://Gio"
import GLib from "gi://GLib"
import { registry, WidgetCfg, WidgetName } from "../widgets/registry"

export type Config = {
  bar: {
    left: WidgetName[]
    center: WidgetName[]
    right: WidgetName[]
  },
  colors: {
    base00: string,
    base01: string,
    base02: string,
    base03: string,
    base04: string,
    base05: string,
    base06: string,
    base07: string,
    base08: string,
    base09: string,
    base0A: string,
    base0B: string,
    base0C: string,
    base0D: string,
    base0E: string,
    base0F: string,
  },
  widgets: {
    [K in WidgetName]: WidgetCfg[K]
  }
}

export type ConfigChangeCallback = (config: Config) => void

class ConfigManager {
  private monitor: Gio.FileMonitor | null = null
  private lastMtime: number | null = null
  private callbacks: ConfigChangeCallback[] = []

  public defaultsPath: string
  public configPath: string = `${GLib.get_user_config_dir()}/ags-bar/config.toml`

  constructor() {
    let defaultsPath = GLib.getenv("AGS_BAR_DATADIR");

    if (defaultsPath !== null) defaultsPath += "/defaults.toml"
    else
      defaultsPath = GLib
        .get_system_data_dirs()
        .map(d => GLib.build_filenamev([d, "ags-bar", "defaults.toml"]))
        .find(p => GLib.file_test(p, GLib.FileTest.EXISTS)) ?? null

    if (defaultsPath === null) throw new Error("Failed to find defaults.toml")
    this.defaultsPath = defaultsPath
  }

  load() {
    const defaults = this.readToml(this.defaultsPath)
    const user = GLib.file_test(this.configPath, GLib.FileTest.EXISTS) ? this.readToml(this.configPath) : {}
    const final = deepMerge(defaults, user)

    const isRegisteredWidget = (name: string) => {
      if (!Object.keys(registry).includes(name)) {
        console.warn(`${name} widget not found`)
        return false
      }
      return true
    }

    final.bar.left = final.bar.left.filter(isRegisteredWidget)
    final.bar.center = final.bar.center.filter(isRegisteredWidget)
    final.bar.right = final.bar.right.filter(isRegisteredWidget)

    return final
  }

  watch() {
    this.monitor = monitorFile(this.configPath, (_, event) => {
      if (event !== Gio.FileMonitorEvent.CHANGES_DONE_HINT) return
      const mtime = this.getMtime()
      if (mtime === this.lastMtime) return
      this.lastMtime = mtime
      this.callbacks.forEach(cb => cb(this.load()))
    })
  }

  onChange(cb: ConfigChangeCallback) {
    this.callbacks.push(cb)
  }

  private readToml(path: string) {
    const stdout = exec(`tomlq . ${path}`)
    return JSON.parse(stdout)
  }

  private getMtime() {
    try {
      const file = Gio.File.new_for_path(this.configPath)
      const info = file.query_info("time::modified", Gio.FileQueryInfoFlags.NONE, null)
      return info.get_attribute_uint64("time::modified")
    } catch {
      return null
    }
  }
}

export const configManager = new ConfigManager()

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

function deepMerge(base: Config, override: DeepPartial<Config>) {
  const result: any = { ...base }
  for (const key in override as any) {
    const b = (base as any)[key]
    const o = (override as any)[key]
    if (o !== null && typeof o === "object" && !Array.isArray(o) && typeof b === "object")
      result[key] = deepMerge(b, o)
    else
      result[key] = o
  }
  return result as Config
}
