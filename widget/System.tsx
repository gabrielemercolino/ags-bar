import { exec } from "ags/process"
import { lockCommand, rebootCommand, shutdownCommand } from "../commands"
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
      onClicked={() => exec(shutdownCommand())}
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
      onClicked={() => exec(rebootCommand())}
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
      onClicked={() => exec(lockCommand())}
    >
      
    </Button>
  )
}
