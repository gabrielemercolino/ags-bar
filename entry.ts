import app from "ags/gtk4/app"

import { buildBar } from "./Bar"
import { configManager } from "./managers/ConfigManager"
import { CssManager } from "./managers/CssManager"
import { createRoot } from "ags"
import styles from "./styles.scss"

app.start({
  instanceName: "ags-bar",
  main(...argv: string[]) {
    if (argv.length > 1) configManager.configPath = argv[1]
    const initialConfig = configManager.load()

    const css = new CssManager(initialConfig, styles)
    let bars = app.get_monitors().map(monitor => createRoot(() => buildBar(monitor, initialConfig)))

    configManager.watch()

    configManager.onChange(newConfig => {
      bars.forEach(bar => bar.destroy())
      css.reset(newConfig, styles)
      bars = app.get_monitors().map(monitor => createRoot(() => buildBar(monitor, newConfig)))
    })
  },
})
