import AstalWp from "gi://AstalWp";
import { Accessor, createBinding, createComputed, For, With } from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import Pango from "gi://Pango";
import Button from "../components/Button";

const audio = AstalWp.get_default()?.audio;

export default function AudioMenu() {
  if (!audio) {
    return <label label="Audio N/A" />;
  }

  const microphones = createBinding(audio, "microphones");
  const speakers = createBinding(audio, "speakers");
  const defaultMicrophone = createBinding(audio, "default_microphone");
  const defaultSpeaker = createBinding(audio, "default_speaker");

  return (
    <menubutton
      cssName="audio"
      cursor={Gdk.Cursor.new_from_name("pointer", null)}
    >
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
        <box>
          <With value={defaultMicrophone}>
            {(mic) => {
              if (!mic) return <label cssName="icon" label={getMicIcon(false)} tooltip_text="N/A" />;
              const volume = createBinding(mic, "volume");
              const muted = createBinding(mic, "mute");
              return (
                <label
                  cssName="icon"
                  label={muted.as(m => getMicIcon(m))}
                  tooltip_text={muted.as(m => m ? "muted" : `${Math.round(volume() * 100)}%`)}
                />
              );
            }}
          </With>
        </box>
        <box>
          <With value={defaultSpeaker}>
            {(spk) => {
              if (!spk) return <label cssName="icon" label={getSpeakerIcon(false, 0)} tooltip_text="N/A" />;
              const volume = createBinding(spk, "volume");
              const muted = createBinding(spk, "mute");
              return (
                <label
                  cssName="icon"
                  label={muted.as(m => getSpeakerIcon(m, volume() * 100))}
                  tooltip_text={muted.as(m => m ? "muted" : `${Math.round(volume() * 100)}%`)}
                />
              );
            }}
          </With>
        </box>
      </box>

      <popover cssName="pop-up">
        <box orientation={Gtk.Orientation.HORIZONTAL}>
          <PopupColumn label="Microphone" endpoints={microphones} />
          <PopupColumn label="Speaker" endpoints={speakers} />
        </box>
      </popover>
    </menubutton>
  );
}

type PopupColumnParams = {
  label: "Microphone" | "Speaker",
  endpoints: Accessor<Array<AstalWp.Endpoint>>
}

function PopupColumn({ label, endpoints }: PopupColumnParams) {
  return (
    <box cssName="column" orientation={Gtk.Orientation.VERTICAL} spacing={4}>
      <label cssName="title" label={label} />
      <box cssName="list" orientation={Gtk.Orientation.VERTICAL} spacing={4}>
        <For each={endpoints}>
          {(e) => label === "Microphone" ? <MicrophoneEntry endpoint={e} /> : <SpeakerEntry endpoint={e} />}
        </For>
      </box>
    </box>
  )
}

function MicrophoneEntry({ endpoint }: { endpoint: AstalWp.Endpoint }) {
  return (
    <AudioDeviceEntry endpoint={endpoint} cssName="microphone" getIcon={(muted) => getMicIcon(muted)} />
  )
}

function SpeakerEntry({ endpoint }: { endpoint: AstalWp.Endpoint }) {
  return (
    <AudioDeviceEntry endpoint={endpoint} cssName="speaker" getIcon={(muted, volume) => getSpeakerIcon(muted, volume)} />
  )
}

type AudioDeviceEntryParams = {
  endpoint: AstalWp.Endpoint,
  cssName: string,
  getIcon: (muted: boolean, volume: number) => string
}

function AudioDeviceEntry({ endpoint, cssName, getIcon }: AudioDeviceEntryParams) {
  const volume = createBinding(endpoint, "volume")
  const muted = createBinding(endpoint, "mute")
  const state = createComputed(() => ({ volume: volume(), muted: muted() }))
  const description = createBinding(endpoint, "description")
  const isDefault = createBinding(endpoint, "is_default")

  return (
    <box
      cssName={cssName}
      class={isDefault.as(d => d ? "selected" : "")}
      spacing={8}
    >
      <Button onLeftClick={() => endpoint.set_mute(!endpoint.get_mute())}>
        <label
          cssName="icon"
          label={state.as(({ muted, volume }) => getIcon(muted, volume * 100))}
          tooltipMarkup={muted.as(m => m ? "unmute" : "mute")}
        />
      </Button>

      <Button onLeftClick={() => endpoint.set_is_default(!endpoint.get_is_default())}>
        <label
          cssName="name"
          label={description.as(d => d || "Unknown")}
          maxWidthChars={10}
          ellipsize={Pango.EllipsizeMode.END}
          tooltipText={description.as(d => d || "Unknown")}
        />
      </Button>

      <slider
        class={isDefault.as(d => d ? "selected" : "")}
        value={volume}
        tooltipText={volume(v => `${Math.round(v * 100)}%`)}
        hexpand
        widthRequest={100}
        onChangeValue={(_src, _scroll, val) => endpoint.set_volume(val)}
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
    </box>
  );
}


function getSpeakerIcon(muted: boolean, volume: number) {
  if (muted) return " "
  if (volume > 70) return " "
  if (volume > 30) return " "
  return " "
}

function getMicIcon(muted: boolean) {
  return muted ? "󰍭" : ""
}

