import app from "ags/gtk4/app"

class CssManager {
  private baseCss = ""

  registerBase(css: string) {
    this.baseCss = css
  }

  apply(colors: Record<string, string>, vars: Record<string, string>) {
    const baseColors = Object.entries(colors)
      .map(([k, v]) => `\t--${k}: ${v};`)
      .join("\n")

    const widgetVars = Object.entries(vars)
      .map(([k, v]) => `\t${k}: ${v.startsWith("base") ? `var(--${v})` : v};`)
      .join("\n")

    app.reset_css()
    app.apply_css(`* {\n${baseColors}\n}`)
    app.apply_css(`* {\n${widgetVars}\n}`)
    app.apply_css(this.baseCss)
  }
}
export const cssManager = new CssManager()
