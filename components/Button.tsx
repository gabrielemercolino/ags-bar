import { Gdk } from "ags/gtk4"
import Gtk from "gi://Gtk?version=4.0"

type ButtonProps = {
  onLeftClick?: (self: Gtk.Widget) => void
  onRightClick?: (self: Gtk.Widget) => void
  cssName?: string
  children?: JSX.Element | JSX.Element[] | string | number
  [key: string]: any
}

export default function Button({
  onLeftClick,
  onRightClick,
  cssName,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      cssName={cssName}
      onClicked={onLeftClick}
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
      {...props}
      $={(self) => {
        if (onRightClick) {
          const gesture = Gtk.GestureClick.new()
          gesture.set_button(Gdk.BUTTON_SECONDARY)
          gesture.connect("released", () => onRightClick(self))
          self.add_controller(gesture)
        }
      }}
    >
      {children}
    </button>
  )
}
