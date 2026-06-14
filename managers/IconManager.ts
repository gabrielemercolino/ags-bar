import { exec } from "ags/process"
import { readFile } from "ags/file"
import { getDataDir } from "../utils"

const ICONS_PATH = `${getDataDir()}/icons.toml`

class IconManager {
  private icons: Record<string, Record<string, string>>

  constructor() {
    const json = exec(`tomlq -r '.' ${ICONS_PATH}`)
    this.icons = JSON.parse(json)
  }

  getDistroIcon(os: string) {
    if (os === "auto") {
      const osRelease = readFile("/etc/os-release")
      const id = osRelease.match(/^ID=(.+)$/m)?.[1]?.toLowerCase().trim() ?? ""
      return this.icons.os[id] ?? this.icons.os.fallback
    }

    return this.icons.os[os] ?? this.icons.os.fallback
  }
}

export const iconManager = new IconManager()
