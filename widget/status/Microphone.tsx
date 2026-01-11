import AstalWp from "gi://AstalWp";
import { createBinding, createComputed, For, With } from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import Pango from "gi://Pango";
import Button from "../../components/Button";

const audio = AstalWp.get_default().audio

export default function Microphone() {
  const all_microphones = createBinding(audio, "microphones")
    .as(all => all.sort((a, _b) => a.get_is_default() ? -1 : 1)) // put the default on top
  const default_not_avaible = all_microphones.as(all => all.find(m => m.get_is_default()) == undefined)

  return (
    <menubutton
      cssName="audio-input"
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <DefaultMicrophoneWidget />
      <popover cssName="pop-up">
        <box
          cssName="microphones"
          orientation={Gtk.Orientation.VERTICAL}
        >
          <For each={all_microphones}>
            {microphone => <MicrophoneEntry microphone={microphone} />}
          </For>
        </box>
      </popover>
    </menubutton>
  )
}


function DefaultMicrophoneWidget() {
  const default_microphone = createBinding(audio, "default_microphone")

  return (
    <With value={default_microphone}>
      {
        (microphone) => {
          const muted = createBinding(microphone, "mute")
          const volume = createBinding(microphone, "volume")
          const microphone_state = createComputed(() => ({ muted: muted(), volume: volume() }))

          return (
            <label
              label={muted.as((muted) => getIcon(muted))}
              tooltip_text={microphone_state.as(({ volume, muted }) => muted ? "muted" : `${Math.round(volume * 100)}%`)}
            />
          )
        }
      }
    </With>
  )
}


type MicrophoneEntryProps = {
  microphone: AstalWp.Endpoint
}
function MicrophoneEntry({ microphone }: MicrophoneEntryProps) {
  const muted = createBinding(microphone, "mute")
  const volume = createBinding(microphone, "volume")
  const is_default = createBinding(microphone, "is_default")

  return (
    <box
      cssName="microphone"
      class={is_default.as(d => d ? "default" : "")}
      spacing={8}
    >
      <Button onClicked={() => microphone.set_mute(!microphone.get_mute())}>
        <label
          cssName="icon"
          label={muted.as((muted) => getIcon(muted))}
          tooltipMarkup={muted.as(m => m ? "unmute" : "mute")}
        />
      </Button>

      <label
        cssName="name"
        label={microphone.get_description() ?? "no name"}
        maxWidthChars={10}
        ellipsize={Pango.EllipsizeMode.END}
        tooltipText={microphone.get_description() ?? "no name"}
      />

      <slider
        value={volume}
        class={is_default.as(d => d ? "default" : "")}
        hexpand
        onChangeValue={(_source, _scroll_type, val) => microphone.set_volume(val)}
        cursor={Gdk.Cursor.new_from_name("grab", null)}
        $={(self) => {
          const gesture = Gtk.GestureClick.new()

          const set_cursor_helper = (name: string) =>
            self.set_cursor(Gdk.Cursor.new_from_name(name, null))

          gesture.connect("pressed", () => set_cursor_helper("grabbing"))
          gesture.connect("released", () => set_cursor_helper("grab"))
          gesture.connect("unpaired-release", () => set_cursor_helper("grab"))

          self.add_controller(gesture)
        }}
      />

      <Button
        tooltipText={is_default.as(d => d ? "default" : "set as default")}
        onClicked={() => microphone.set_is_default(!microphone.is_default)}
      >
        <label label={is_default.as(d => d ? "" : "")} />
      </Button>
    </box>
  )
}

function getIcon(muted: boolean) {
  if (muted) return "󰍭"
  return ""
}
