import AstalWp from "gi://AstalWp?version=0.1"
import { createBinding, createComputed, With } from "ags"
import { execAsync } from "ags/process"
import { audioCommand } from "../../commands"

const wireplumber = AstalWp.get_default()

export default function Audio() {
  const muted = createBinding(wireplumber.get_default_speaker(), "mute")
  const volume = createBinding(wireplumber.get_default_speaker(), "volume")

  const both = createComputed([muted, volume], (m, v) => {
    return {
      muted: m,
      volume: v,
    }
  })

  return (
    <button
      cssName="audio"
      onClicked={() => execAsync(audioCommand()).catch(console.error)}
    >
      <With value={both}>
        {({ muted, volume }) => (
          <label label={muted ? " " : ` ${Math.round(volume * 100)}%`} />
        )}
      </With>
    </button>
  )
}
