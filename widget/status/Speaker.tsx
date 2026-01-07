import AstalWp from "gi://AstalWp"
import { Accessor, createBinding, createComputed, For, With } from "ags"
import { Gdk, Gtk } from "ags/gtk4"
import Pango from "gi://Pango"
import Button from "../../components/Button"

const audio = AstalWp.get_default().audio

export default function Speaker() {
  const all_speakers = createBinding(audio, "speakers")
    .as(all => all.sort((a, _b) => a.get_is_default() ? -1 : 1)) // put the default on top

  return (

    <menubutton
      cssName="audio-output"
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <DefaultSpeakerWidget />
      <popover cssName="pop-up">
        <box
          cssName="speakers"
          orientation={Gtk.Orientation.VERTICAL}
        >
          <For each={all_speakers}>
            {speaker => <SpeakerEntry speaker={speaker} />}
          </For>
        </box>
      </popover>
    </menubutton >
  )
}


function DefaultSpeakerWidget() {
  const default_speaker = createBinding(audio, "default_speaker")

  return (
    <With value={default_speaker}>
      {
        (speaker) => {
          const muted = createBinding(speaker, "mute")
          const volume = createBinding(speaker, "volume")
          const speaker_state = createComputed(() => ({ muted: muted(), volume: volume() }))

          return (
            <label
              label={speaker_state.as(({ muted, volume }) => getIcon(muted, volume))}
            />
          )
        }
      }
    </With>
  )
}

type SpeakerEntryProps = {
  speaker: AstalWp.Endpoint
}
function SpeakerEntry({ speaker }: SpeakerEntryProps) {
  const muted = createBinding(speaker, "mute")
  const volume = createBinding(speaker, "volume")
  const speaker_state = createComputed(() => ({ muted: muted(), volume: volume() }))
  const is_default = createBinding(speaker, "is_default")

  return (
    <box
      cssName="speaker"
      class={is_default.as(d => d ? "default" : "")}
      spacing={8}
    >
      <Button onClicked={() => speaker.set_mute(!speaker.get_mute())}>
        <label
          cssName="icon"
          label={speaker_state.as(({ muted, volume }) => getIcon(muted, volume))}
          tooltipMarkup={muted.as(m => m ? "unmute" : "mute")}
        />
      </Button>

      <label
        cssName="name"
        label={speaker.get_description() ?? "no name"}
        maxWidthChars={10}
        ellipsize={Pango.EllipsizeMode.END}
        tooltipText={speaker.get_description() ?? "no name"}
      />

      <slider
        value={volume}
        class={is_default.as(d => d ? "default" : "")}
        hexpand
        onChangeValue={(_source, _scroll_type, val) => speaker.set_volume(val)}
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
        onClicked={() => speaker.set_is_default(!speaker.is_default)}
      >
        <label label={is_default.as(d => d ? "" : "")} />
      </Button>
    </box>
  )
}

function getIcon(muted: boolean, volume: number) {
  if (muted) return " "

  const v = Math.round(volume * 100)

  if (v > 70) return " "
  if (v > 30) return " "
  return " "
}
