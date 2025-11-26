const SHUTDOWN_COMMAND = "systemctl poweroff"
const REBOOT_COMMAND = "systemctl reboot"
const LOCK_COMMAND = "swaylock"

const AUDIO_COMMAND = "pavucontrol"

export const shutdownCommand = () => SHUTDOWN_COMMAND
export const rebootCommand = () => REBOOT_COMMAND
export const lockCommand = () => LOCK_COMMAND

export const audioCommand = () => AUDIO_COMMAND
