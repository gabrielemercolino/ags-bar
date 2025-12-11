import AstalWp from "gi://AstalWp"
import { Accessor, createBinding, createComputed, For, With } from "ags"
import { Gtk } from "ags/gtk4"
import Pango from "gi://Pango"

const audio = AstalWp.get_default().audio

export default function Speaker() {
  const all_speakers = createBinding(audio, "speakers")
    .as(all => all.sort((a, _b) => a.get_is_default() ? -1 : 1)) // put the default on top
  const default_not_avaible = all_speakers.as(all => all.find(m => m.get_is_default()) == undefined)

  return (
    <menubutton cssName="audio-output">
      <DefaultSpeakerWidget />
      <popover cssName="pop-up">
        <box
          cssName="speakers"
          orientation={Gtk.Orientation.VERTICAL}
        >
          <box
            cssName="warning"
            visible={default_not_avaible}
            spacing={8}
          >
            <label label="" />
            <label label="default speaker is not avaible" />
          </box>
          <For each={all_speakers}>
            {speaker => <SpeakerEntry speaker={speaker} />}
          </For>
        </box>
      </popover>
    </menubutton>
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
              label={speaker_state.as(({ muted, volume }) =>
                `${getIcon(muted, volume)} ${Math.round(volume * 100)}%`)}
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
      <button onClicked={() => speaker.set_mute(!speaker.get_mute())}>
        <label
          cssName="icon"
          label={speaker_state.as(({ muted, volume }) => getIcon(muted, volume))}
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
        class={is_default.as(d => d ? "default" : "")}
        hexpand
        onChangeValue={(_source, _scroll_type, val) => speaker.set_volume(val)}
      />

      <label
        visible={is_default}
        label=""
        tooltipText="default speaker"
      />
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
