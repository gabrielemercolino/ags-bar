import app from "ags/gtk4/app"
import style from "./styles/style.scss"

import { buildBar } from "./Bar"
import { configManager } from "./managers/ConfigManager"
import { cssManager } from "./managers/CssManager"
import { createRoot } from "ags"

app.start({
  instanceName: "ags-bar",
  main(...argv: string[]) {
    cssManager.registerBase(style)
    if (argv.length > 1) configManager.configPath = argv[1]
    const initialConfig = configManager.load()

    let bars = app.get_monitors().map(monitor => buildBar(monitor, initialConfig))

    configManager.watch()

    configManager.onChange(newConfig => {
      bars.forEach(bar => bar.destroy())
      bars = app.get_monitors().map(monitor => createRoot(() => buildBar(monitor, newConfig)))
    })
  },
})
