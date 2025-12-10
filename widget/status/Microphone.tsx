import AstalWp from "gi://AstalWp";
import { createBinding, createComputed, For, With } from "ags";
import { Gtk } from "ags/gtk4";
import Pango from "gi://Pango";

const audio = AstalWp.get_default().audio

export default function Microphone() {
  const all_microphones = createBinding(audio, "microphones")

  return (
    <menubutton cssName="audio-input">
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
              label={microphone_state.as(({ muted, volume }) =>
                `${getIcon(muted)} ${Math.round(volume * 100)}%`)}
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
      css_name="microphone"
      class={is_default.as(d => d ? "default" : "")}
      spacing={8}
    >
      <button onClicked={() => microphone.set_mute(!microphone.get_mute())}>
        <label
          cssName="icon"
          label={muted.as((muted) => getIcon(muted))}
          tooltipMarkup={muted.as(m => m ? "unmute" : "mute")}
        />
      </button>

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
      />
    </box>
  )
}

function getIcon(muted: boolean) {
  if (muted) return "󰍭"
  return ""
}
