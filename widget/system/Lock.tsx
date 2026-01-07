import { exec } from "ags/process"
import { lockCommand } from "../../commands"
import Button from "../../components/Button"

export default function Lock() {
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
