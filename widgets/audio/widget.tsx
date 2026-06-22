import { Accessor, createBinding, createComputed, createEffect, For, With } from "ags";
import { Gdk, Gtk } from "ags/gtk4";
import AstalWp from "gi://AstalWp";
import Pango from "gi://Pango";
import { Descriptor } from "../registry";
import Button from "../../components/Button";
import { iconManager } from "../../managers/IconManager";
import { createLazyRoot } from "../../utils";
import { BarContext } from "../../BarContext";
import { AudioOsd, AudioOSDConfig } from "./osd";
import styles from "./styles.scss";

const audio = AstalWp.get_default()?.audio;

type AudioConfig = {
  osd: AudioOSDConfig,

  // css
  bg: string,
  fg: string,
  hover: { fg: string },
  popup: {
    bg: string,
    fg: string,
    title: { fg: string },
    device: {
      fg: string,
      selected: { bg: string, fg: string }
    },
    slider: { fg: string }
  }
}

export function Widget(cfg: AudioConfig) {
  if (!audio) return <label label="Audio N/A" /> as Gtk.Widget;

  const { monitor } = BarContext.use()
  const defaultMicrophone = createBinding(audio, "default_microphone");
  const defaultSpeaker = createBinding(audio, "default_speaker");

  const [osd, destroyOsd] = createLazyRoot(
    () => AudioOsd(monitor, cfg.osd),
    (o) => o?.destroy()
  )

  let speakerRef: AstalWp.Endpoint | null = null
  let speakerVolumeHandlerId = 0

  let microphoneRef: AstalWp.Endpoint | null = null
  let microphoneVolumeHandlerId = 0

  createEffect(() => {
    const spk = defaultSpeaker()
    if (speakerRef && speakerRef !== spk) {
      speakerRef.disconnect(speakerVolumeHandlerId)
      speakerRef = null
    }
    speakerRef = spk
    if (!spk) return
    speakerVolumeHandlerId = spk.connect(
      "notify",
      () => osd().show("speaker", spk.volume * 100, spk.mute)
    )
  })

  createEffect(() => {
    const mic = defaultMicrophone()
    if (microphoneRef && microphoneRef !== mic) {
      microphoneRef.disconnect(microphoneVolumeHandlerId)
      microphoneRef = null
    }
    microphoneRef = mic
    if (!mic) return
    microphoneVolumeHandlerId = mic.connect(
      "notify",
      () => osd().show("microphone", mic.volume * 100, mic.mute)
    )
  })

  const widget = (
    <menubutton cssName="audio" cursor={Gdk.Cursor.new_from_name("pointer", null)}>
      <box orientation={Gtk.Orientation.HORIZONTAL} spacing={12}>
        <MicIndicator defaultMicrophone={defaultMicrophone} />
        <SpeakerIndicator defaultSpeaker={defaultSpeaker} />
      </box>

      <popover cssName="pop-up">
        <AudioPopover />
      </popover>
    </menubutton>
  ) as Gtk.Widget

  widget.connect("unrealize", destroyOsd)

  return widget
}

function MicIndicator({ defaultMicrophone }: { defaultMicrophone: Accessor<AstalWp.Endpoint | null> }) {
  return (
    <box>
      <With value={defaultMicrophone}>
        {(mic) => {
          if (!mic) return <label cssName="icon" label={iconManager.getAudioIcon("microphone", false, 0)} tooltip_text="N/A" />;
          const muted = createBinding(mic, "mute");
          const volume = createBinding(mic, "volume");
          return (
            <label
              cssName="icon"
              label={createComputed(() => iconManager.getAudioIcon("microphone", muted(), volume() * 100))}
              tooltip_text={createComputed(() => muted() ? "muted" : `${Math.round(volume() * 100)}%`)}
            />
          );
        }}
      </With>
    </box>
  )
}

function SpeakerIndicator({ defaultSpeaker }: { defaultSpeaker: Accessor<AstalWp.Endpoint | null> }) {
  return (
    <box>
      <With value={defaultSpeaker}>
        {(spk) => {
          if (!spk) return <label cssName="icon" label={iconManager.getAudioIcon("speaker", false, 0)} tooltip_text="N/A" />;
          const muted = createBinding(spk, "mute");
          const volume = createBinding(spk, "volume");
          return (
            <label
              cssName="icon"
              label={createComputed(() => iconManager.getAudioIcon("speaker", muted(), volume() * 100))}
              tooltip_text={createComputed(() => muted() ? "muted" : `${Math.round(volume() * 100)}%`)}
            />
          );
        }}
      </With>
    </box>
  )
}

function AudioPopover() {
  if (!audio) return <label label="N/A" />;

  const microphones = createBinding(audio, "microphones") as Accessor<Array<AstalWp.Endpoint>>;
  const speakers = createBinding(audio, "speakers") as Accessor<Array<AstalWp.Endpoint>>;

  return (
    <box orientation={Gtk.Orientation.HORIZONTAL}>
      <PopupColumn label="Microphone" endpoints={microphones} />
      <PopupColumn label="Speaker" endpoints={speakers} />
    </box>
  )
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
          {(e) => label === "Microphone"
            ? <MicrophoneEntry endpoint={e} />
            : <SpeakerEntry endpoint={e} />}
        </For>
      </box>
    </box>
  )
}

function MicrophoneEntry({ endpoint }: { endpoint: AstalWp.Endpoint }) {
  return (
    <AudioDeviceEntry
      endpoint={endpoint}
      type="microphone"
      getIcon={(muted, volume) => iconManager.getAudioIcon("microphone", muted, volume)}
    />
  )
}

function SpeakerEntry({ endpoint }: { endpoint: AstalWp.Endpoint }) {
  return (
    <AudioDeviceEntry
      endpoint={endpoint}
      type="speaker"
      getIcon={(muted, volume) => iconManager.getAudioIcon("speaker", muted, volume)}
    />
  )
}

type AudioDeviceEntryParams = {
  endpoint: AstalWp.Endpoint,
  type: "speaker" | "microphone",
  getIcon: (muted: boolean, volume: number) => string
}

function AudioDeviceEntry({ endpoint, type, getIcon }: AudioDeviceEntryParams) {
  const volume = createBinding(endpoint, "volume")
  const muted = createBinding(endpoint, "mute")
  const description = createBinding(endpoint, "description")
  const isDefault = createBinding(endpoint, "is_default")

  return (
    <box
      cssName={type}
      class={isDefault.as(d => d ? "selected" : "")}
      spacing={8}
    >
      <Button onLeftClick={() => endpoint.set_mute(!endpoint.get_mute())}>
        <label
          cssName="icon"
          label={createComputed(() => getIcon(muted(), volume() * 100))}
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


export const descriptor = {
  parseCss: (cfg) => ({
    vars: {
      "--audio-bg": cfg.bg,
      "--audio-fg": cfg.fg,
      "--audio-hover-fg": cfg.hover.fg,
      "--audio-popup-bg": cfg.popup.bg,
      "--audio-popup-fg": cfg.popup.fg,
      "--audio-popup-title-fg": cfg.popup.title.fg,
      "--audio-popup-device-fg": cfg.popup.device.fg,
      "--audio-popup-device-selected-fg": cfg.popup.device.selected.fg,
      "--audio-popup-device-selected-bg": cfg.popup.device.selected.bg,
      "--audio-popup-slider-fg": cfg.popup.slider.fg,
      "--audio-osd-bg": cfg.osd.bg,
      "--audio-osd-fg": cfg.osd.fg,
      "--audio-osd-trough-bg": cfg.osd.trough.bg,
    },
    css: styles
  }),
} satisfies Descriptor<AudioConfig>
