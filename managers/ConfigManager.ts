import { monitorFile } from "ags/file"
import { exec } from "ags/process"

import Gio from "gi://Gio"
import GLib from "gi://GLib"
import { createRoot } from "gnim"

export type ConfigChangeCallback = (config: any) => void

class ConfigManager {
  private monitor: Gio.FileMonitor | null = null
  private timeout: ReturnType<typeof setTimeout> | null = null
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
    return deepMerge(defaults, user)
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

  private getMtime(): number | null {
    try {
      const file = Gio.File.new_for_path(this.configPath)
      const info = file.query_info("time::modified", Gio.FileQueryInfoFlags.NONE, null)
      return info.get_attribute_uint64("time::modified")
    } catch {
      return null
    }
  }
}
createRoot
export const configManager = new ConfigManager()

function deepMerge(base: any, override: any) {
  const result = { ...base }
  for (const key in override) {
    if (
      override[key] !== null &&
      typeof override[key] === "object" &&
      !Array.isArray(override[key]) &&
      typeof base[key] === "object"
    )
      result[key] = deepMerge(base[key], override[key])
    else
      result[key] = override[key]
  }
  return result
}

