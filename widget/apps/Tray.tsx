import AstalTray from "gi://AstalTray"
import GLib from "gi://GLib"
import { createBinding, createComputed, For, With } from "ags"
import { Gtk } from "ags/gtk4"
import Button from "../../components/Button"

const tray = AstalTray.get_default()

export default function Tray() {
  //TODO: fix properly `g_list_store_remove: assertion '!g_sequence_iter_is_end (it)' failed`
  const items = createBinding(tray, "items").as((items) =>
    items.filter((it) => it.get_title() !== null),
  )

  return (
    <box cssName="tray" spacing={4} visible={items.as((it) => it.length > 0)}>
      <For each={items}>
        {(item) => {
          const icon = createBinding(item, "gicon")
          const menuModel = createBinding(item, "menuModel")
          const actionGroup = createBinding(item, "actionGroup")

          const bindings = createComputed(() => ({
            icon: icon(),
            menuModel: menuModel(),
            actionGroup: actionGroup(),
          }))

          return (
            <box cssName="item-container">
              <With value={bindings}>
                {({ icon, menuModel, actionGroup }) => {
                  let menu: Gtk.PopoverMenu | null = null

                  if (menuModel) {
                    menu = Gtk.PopoverMenu.new_from_model(menuModel)
                    if (actionGroup)
                      menu.insert_action_group("dbusmenu", actionGroup)
                  }

                  return (
                    <Button
                      cssName="item"
                      tooltipMarkup={createBinding(item, "tooltipMarkup")}
                      onRightClick={(self) => {
                        if (menu) {
                          menu.set_parent(self)
                          menu.popup()
                          menu.connect("closed", () => {
                            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                              menu.unparent()
                              return GLib.SOURCE_REMOVE
                            })
                          })
                        }
                      }}
                      onLeftClick={() => item.activate(0, 0)}
                    >
                      <image gicon={icon} />
                    </Button>
                  )
                }}
              </With>
            </box>
          )
        }}
      </For>
    </box>
  )
}
