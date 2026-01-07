import { exec } from "ags/process"
import { shutdownCommand } from "../../commands"
import Button from "../../components/Button"

export default function Shutdown() {
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
