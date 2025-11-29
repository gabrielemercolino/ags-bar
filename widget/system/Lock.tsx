import { exec } from "ags/process"
import { lockCommand } from "../../commands"

export default function Lock() {
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
