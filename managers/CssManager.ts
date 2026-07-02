import app from "ags/gtk4/app"
import { registry } from "../widgets/registry"
import { Config } from "./ConfigManager"
import styles from "../styles.scss"

export class CssManager {
  constructor(config: Config, additionalCss: string) {
    this.apply(config, additionalCss)
  }

  reset(config: Config, additionalCss: string) {
    app.reset_css()
    this.apply(config, additionalCss)
  }

  private apply(config: Config, additionalCss: string) {
    const all = [...config.bar.left, ...config.bar.center, ...config.bar.right]
    const unique = [...new Set(all)]

    const widgetStyles = unique
      .filter(name => name in registry)
      .map(name => {
        const entry = registry[name]
        const css = entry.css as (cfg: any) => ReturnType<typeof entry.css>
        return css(config.widgets[name])
      })

    const mergedVars: Record<string, string> = Object.assign({}, ...widgetStyles.map(w => w.vars))
    const mergedCss = widgetStyles.flatMap(w => w.css ?? []).join("\n")

    const baseColors = Object.entries(config.colors)
      .map(([k, v]) => `\t--${k}: ${v};`)
      .join("\n")

    const widgetVars = Object.entries(mergedVars)
      .map(([k, v]) => `\t${k}: ${v.startsWith("base") ? `var(--${v})` : v};`)
      .join("\n")

    app.apply_css(`* {\n${baseColors}\n}`)
    if (widgetVars) app.apply_css(`* {\n${widgetVars}\n}`)
    app.apply_css(styles)
    if (mergedCss) app.apply_css(mergedCss)
    app.apply_css(additionalCss)
  }
}
