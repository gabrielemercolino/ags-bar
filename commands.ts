const SHUTDOWN_COMMAND = "systemctl shutdown"
const REBOOT_COMMAND = "systemctl reboot"
const LOCK_COMMAND = "swaylock"

const AUDIO_COMMAND = "pavucontrol"
const BLUETOOTH_COMMAND = "blueman-manager"

export const shutdownCommand = () => SHUTDOWN_COMMAND
export const rebootCommand = () => REBOOT_COMMAND
export const lockCommand = () => LOCK_COMMAND

export const audioCommand = () => AUDIO_COMMAND
export const bluetoothCommand = () => BLUETOOTH_COMMAND
