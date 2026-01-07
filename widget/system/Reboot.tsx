import { exec } from "ags/process"
import { rebootCommand } from "../../commands"
import Button from "../../components/Button"

export default function Reboot() {
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
