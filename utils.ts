import { createRoot } from "ags"
import GLib from "gi://GLib"

export function getDataDir() {
  const fromEnv = GLib.getenv("AGS_BAR_DATADIR")
  if (fromEnv !== null) return fromEnv

  const found = GLib
    .get_system_data_dirs()
    .map(d => GLib.build_filenamev([d, "ags-bar"]))
    .find(p => GLib.file_test(p, GLib.FileTest.EXISTS)) ?? null

  if (found === null) throw new Error("Failed to find ags-bar data directory")
  return found
}

export function createLazyRoot<T>(factory: () => T, destructor: (val: T | null) => void) {
  let value: T | null = null
  const get = () => (value ??= createRoot(() => factory()))
  const dispose = () => {
    const old = value
    value = null
    destructor(old)
  }
  return [get, dispose] as const
}
