import { Accessor, For } from "ags"
import { Gtk } from "ags/gtk4"
import { iconManager } from "../../managers/IconManager"
import Button from "../../components/Button"
import AnimatedScrolledWindow from "../../components/AnimatedScrolledWindow"

type SectionHeaderProps = {
  title: string
  expanded: Accessor<boolean>
  onToggle: () => void
}

export function SectionHeader({ title, expanded, onToggle }: SectionHeaderProps) {
  return (
    <Button onLeftClick={onToggle} hexpand>
      <box spacing={8}>
        <label label={expanded.as(e => e ? iconManager.getGeneralIcon("expanded") : iconManager.getGeneralIcon("collapsedh"))} />
        <label label={title} halign={Gtk.Align.START} hexpand />
      </box>
    </Button>
  )
}

type SectionContentProps<T> = {
  show: Accessor<boolean>
  items: Accessor<T[]>
  children: (item: T) => JSX.Element
}

export function SectionContent<T>({ show, items, children }: SectionContentProps<T>) {
  return (
    <revealer
      revealChild={show}
      transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
      transitionDuration={200}
      vexpand={false}
    >
      <AnimatedScrolledWindow
        maxContentHeight={150}
        duration={200}
        hscrollbarPolicy={Gtk.PolicyType.NEVER}
        propagateNaturalHeight
        trigger={items}
        overlayScrolling
      >
        <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
          <For each={items}>{(item) => children(item)}</For>
        </box>
      </AnimatedScrolledWindow>
    </revealer>
  )
}
