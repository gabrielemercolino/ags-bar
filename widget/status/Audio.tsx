import AstalWp from "gi://AstalWp"
import { Accessor, createBinding, createComputed, For, With } from "ags"
import { Gtk } from "ags/gtk4"
import Pango from "gi://Pango"

const wireplumber = AstalWp.get_default()

export default function Audio() {
  const all_speakers = createBinding(wireplumber, "nodes")
    .as(nodes => nodes.filter(n => n.get_media_class() === AstalWp.MediaClass.AUDIO_SINK))

  return (
    <menubutton cssName="audio-output">
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
    </menubutton>
  )
}


function DefaultSpeakerWidget() {
  const default_speaker = createBinding(wireplumber, "default_speaker")

  return (
    <With value={default_speaker}>
      {
        (speaker) => {
          const muted = createBinding(speaker, "mute")
          const volume = createBinding(speaker, "volume")
          const speaker_state = createComputed(() => ({ muted: muted(), volume: volume() }))

          return (
            <label
              label={speaker_state.as(({ muted, volume }) =>
                `${getVolumeIcon(muted, volume)} ${Math.round(volume * 100)}%`)}
            />
          )
        }
      }
    </With>
  )
}

type SpeakerEntryProps = {
  speaker: AstalWp.Node
}
function SpeakerEntry({ speaker }: SpeakerEntryProps) {
  const muted = createBinding(speaker, "mute")
  const volume = createBinding(speaker, "volume")
  const speaker_state = createComputed(() => ({ muted: muted(), volume: volume() }))

  return (
    <box css_name="speaker" spacing={8}>
      <button onClicked={() => speaker.set_mute(!speaker.get_mute())}>
        <label
          cssName="icon"
          label={speaker_state.as(({ muted, volume }) => getVolumeIcon(muted, volume))}
          tooltipMarkup={muted.as(m => m ? "unmute" : "mute")}
        />
      </button>

      <label
        cssName="name"
        label={speaker.get_description() ?? "no name"}
        maxWidthChars={10}
        ellipsize={Pango.EllipsizeMode.END}
        tooltipText={speaker.get_description() ?? "no name"}
      />

      <slider
        value={volume}
        hexpand
        onChangeValue={(_source, _scroll_type, val) => speaker.set_volume(val)}
      />
    </box>
  )
}

function getVolumeIcon(muted: boolean, volume: number) {
  if (muted) return " "

  const v = Math.round(volume * 100)

  if (v > 70) return " "
  if (v > 30) return " "
  return " "
}
