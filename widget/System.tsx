import { exec } from "ags/process"
import { lockCommand, rebootCommand, shutdownCommand } from "../commands"

export function Shutdown() {
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

export function Reboot() {
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
export function Lock() {
  return (
    <button
      class="lock"
      tooltipText="lock"
      onClicked={() => exec(lockCommand())}
    >
      
    </button>
  )
}
