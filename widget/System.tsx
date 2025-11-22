import { exec } from "ags/process"

export function Shutdown() {
  return (
    <button
      class="shutdown"
      tooltipText="shutdown"
      onClicked={() => exec(["systemctl", "poweroff"])}
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
      onClicked={() => exec(["systemctl", "reboot"])}
    >
      󰜉
    </button>
  )
}
export function Lock() {
  return (
    <button class="lock" tooltipText="lock" onClicked={() => exec("swaylock")}>
      
    </button>
  )
}
