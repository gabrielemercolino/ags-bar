import { exec } from "ags/process"
import { shutdownCommand } from "../../commands"

export default function Shutdown() {
  return (
    <button
      class="shutdown"
      tooltipText="shutdown"
      onClicked={() => exec(shutdownCommand())}
    >
      󰐥
    </button>
  )
}
