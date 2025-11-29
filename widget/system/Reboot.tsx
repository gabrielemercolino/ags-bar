import { exec } from "ags/process"
import { rebootCommand } from "../../commands"

export default function Reboot() {
  return (
    <button
      class="reboot"
      tooltipText="reboot"
      onClicked={() => exec(rebootCommand())}
    >
      󰜉
    </button>
  )
}
