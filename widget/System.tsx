import { exec } from "ags/process"
import { lock, reboot, shutdown } from "../commands"
import Button from "../components/Button"

export default function System() {
  return (
    <box cssName="system">
      <Shutdown />
      <Reboot />
      <Lock />
    </box>
  )
}

function Shutdown() {
  return (
    <Button
      class="shutdown"
      tooltipText="shutdown"
      onClicked={() => exec(shutdown())}
    >
      󰐥
    </Button>
  )
}

function Reboot() {
  return (
    <Button
      class="reboot"
      tooltipText="reboot"
      onClicked={() => exec(reboot())}
    >
      󰜉
    </Button>
  )
}

function Lock() {
  return (
    <Button
      class="lock"
      tooltipText="lock"
      onClicked={() => exec(lock())}
    >
      
    </Button>
  )
}
