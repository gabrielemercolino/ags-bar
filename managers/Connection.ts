import { Accessor, createBinding } from "ags"
import AstalNetwork from "gi://AstalNetwork"
import NM from "gi://NM"

export class WiredManager {
  private network = AstalNetwork.get_default()
  private activated: Accessor<boolean>
  private device: Accessor<NM.DeviceEthernet | null>

  constructor() {
    const wired = this.network.get_wired()
    if (!wired) {
      console.warn("Wired is not avaible, not listening to changes")
      this.activated = new Accessor(() => false)
      this.device = new Accessor(() => null)
    } else {
      this.activated = createBinding(wired, "state").as(state => state === AstalNetwork.DeviceState.ACTIVATED)
      this.device = createBinding(wired, "device")
    }
  }

  public isActivated() {
    return this.activated
  }

  public getDevice() {
    return this.device
  }
}

export class WiFiManager {
  private currentAccessPoint: Accessor<AstalNetwork.AccessPoint | null>
  private accessPoints: Accessor<AstalNetwork.AccessPoint[]>
  private enabled: Accessor<boolean>
  private network = AstalNetwork.get_default()

  constructor() {
    const wifi = this.network.get_wifi()
    if (!wifi) {
      console.warn("WiFi is not avaible, not listening to changes")
      this.currentAccessPoint = new Accessor(() => null)
      this.accessPoints = new Accessor(() => [])
      this.enabled = new Accessor(() => false)
    }
    else {
      this.currentAccessPoint = createBinding(wifi, "active_access_point")
      this.accessPoints = createBinding(wifi, "access_points").as(all =>
        all.toSorted((a, b) => {
          if (a === this.currentAccessPoint()) return -1;
          return b.strength - a.strength;
        }))
      this.enabled = createBinding(wifi, "enabled")

      wifi.scan()
    }
  }

  public getCurrent() {
    return this.currentAccessPoint
  }

  public getAll() {
    return this.accessPoints
  }

  public isEnabled() {
    return this.enabled
  }

  public scan() {
    const wifi = this.network.get_wifi()
    if (!wifi) return
    if (wifi.get_enabled()) wifi.scan()
  }
}
