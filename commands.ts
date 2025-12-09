const SHUTDOWN_COMMAND = "systemctl poweroff"
const REBOOT_COMMAND = "systemctl reboot"
const LOCK_COMMAND = "swaylock"

export const shutdownCommand = () => SHUTDOWN_COMMAND
export const rebootCommand = () => REBOOT_COMMAND
export const lockCommand = () => LOCK_COMMAND
