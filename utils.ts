import { Accessor, createEffect, createRoot, createState } from "ags"
import GLib from "gi://GLib"

export function debounced<T>(accessor: Accessor<T>, delayMs: number): Accessor<T> {
  const [value, setValue] = createState(accessor())
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  createEffect(() => {
    const v = accessor()
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      setValue(v)
      timeoutId = null
    }, delayMs)
  })

  return value
}

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
  let disposer: (() => void) | null = null

  // 1. create a reactive root on first call
  // 2. store the value and the createRoot disposer for later cleanup
  const get = () => {
    if (value === null) {
      value = createRoot((dispose) => {
        disposer = dispose
        return factory()
      })
    }
    return value
  }

  // 1. nulls the cached value
  // 2. disposes the reactive scop
  // 3. runs the external destructor with the old value
  const dispose = () => {
    const old = value
    value = null
    disposer?.()
    disposer = null
    destructor(old)
  }

  return [get, dispose] as const
}
