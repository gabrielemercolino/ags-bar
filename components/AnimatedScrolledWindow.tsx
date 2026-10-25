import { Accessor, CCProps, createEffect, Node } from "ags";
import GObject from "ags/gobject";
import { Gtk } from "ags/gtk4";
import GLib from "gi://GLib";

type Props<T extends Gtk.Widget, Props> = CCProps<T, Partial<Props>>
type AnimatedScrolledWindowProps = Omit<Props<Gtk.ScrolledWindow, Gtk.ScrolledWindow.ConstructorProps>, "children"> & {
  duration?: number,
  trigger: Accessor,
  children: GObject.Object
}

export default function AnimatedScrolledWindow(props: AnimatedScrolledWindowProps) {
  const {
    children,
    trigger,
    maxContentHeight = 250,
    duration = 200,
    ...rest
  } = props

  let scrollWin: Gtk.ScrolledWindow
  let handle: number | null = null
  let currentHeight = 0

  function animateTo(target: number) {
    const from = currentHeight
    const startTime = GLib.get_monotonic_time()
    if (handle !== null) GLib.source_remove(handle)

    handle = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, () => {
      const elapsed = (GLib.get_monotonic_time() - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      currentHeight = Math.round(from + (target - from) * eased)
      scrollWin.maxContentHeight = currentHeight

      if (progress >= 1) { handle = null; return false }
      return true
    })
  }

  createEffect(() => {
    trigger()
    if (!children) return
    const max = typeof maxContentHeight === "function" ? maxContentHeight() : maxContentHeight

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      //TODO: make it safer
      const [, height] = (children as Gtk.Widget).get_preferred_size()
      animateTo(Math.min(height?.height ?? max, max))
      return false
    })
  })

  return (
    <scrolledwindow
      $={(self) => scrollWin = self}
      {...rest}
    >
      {children}
    </scrolledwindow>
  )
}
