# AGS Bar

A GTK4 status bar for Wayland compositors, built with [AGS](https://github.com/Aylur/ags) (Astal), TypeScript, and JSX.

## Features

- **Modular widgets**: power controls, workspaces, window title, network, bluetooth, audio, battery, clock, system tray, and notifications
- **Base16 theming**: define a base16 palette (`base00`–`base0F`) and reference it from any widget color
- **Live reload**: config changes are applied without restarting the bar
- **Multi-monitor**: one bar per monitor, driven by the same config
- **Declarative home-manager module** with systemd integration

## Requirements

- A Wayland compositor supporting `ext-workspace-v1` (workspaces) and `wlr-foreign-toplevel-management-v1` (window title)
- Per-widget services, as needed:
  - **Network** — NetworkManager
  - **Audio** — WirePlumber
  - **Bluetooth** — bluez (`hardware.bluetooth.enable = true;`)
  - **Battery** — UPower

## Installation

Add to your `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    # primary (Codeberg), or the GitHub mirror:
    ags-bar.url = "git+https://codeberg.org/Ciruzzo032/ags-bar";
    # ags-bar.url = "github:gabrielemercolino/ags-bar";
    ags-bar.inputs.nixpkgs.follows = "nixpkgs";
  };
}
```

Import the home-manager module:

```nix
{
  homeManagerModules = [ inputs.ags-bar.homeManagerModules.default ];
}
```

## Configuration

Configuration is a TOML file (`~/.config/ags-bar/config.toml`) deep-merged over the [defaults](defaults.toml). The bar watches this file and applies changes live.

With home-manager, set `programs.ags-bar.settings`:

```nix
programs.ags-bar = {
  enable = true;
  systemd.enable = true;

  settings = {
    # Widgets on the left / center / right
    bar = {
      left = [ "system" "workspaces" ];
      center = [ "title" ];
      right = [ "connections" "audio" "battery" "time" "apps" ];
    };

    # Base16 palette
    colors = {
      base00 = "#1a141f";
      base01 = "#2a1e3b";
      base02 = "#3d2a52";
      base03 = "#544167";
      base04 = "#75658b";
      base05 = "#cfc0d9";
      base06 = "#e5dced";
      base07 = "#f4f0f7";
      base08 = "#ea6d9c";
      base09 = "#e89368";
      base0A = "#d4ac76";
      base0B = "#7abf9e";
      base0C = "#70b8d4";
      base0D = "#7b93db";
      base0E = "#b88cce";
      base0F = "#e87d9a";
    };

    # Per-widget overrides
    widgets.audio.popup.title.fg = "base08";
    widgets.time.clock.format = "+%H:%M";
  };
};
```

### Colors

Every widget color accepts either a raw CSS value or a base16 key. Keys starting with `base` resolve to the palette defined under `colors`:

```toml
[widgets.battery]
bg = "base01"
fg = "base0A"
charging.fg = "rgba(255, 0, 0, 0.5)" # raw CSS values work too
```

## Widgets

| Widget | Description |
|---|---|
| `system` | Power controls (shutdown, reboot, lock, logout) with an OS logo |
| `workspaces` | Workspace switcher (`ext-workspace-v1`) |
| `title` | Active window title |
| `connections` | Network (Wi-Fi/Ethernet) and Bluetooth management |
| `audio` | Volume control with device picker popup and OSD |
| `battery` | Charge level and charging status |
| `time` | Clock with calendar popup |
| `apps` | System tray and notification center |

## Development

```sh
nix develop                     # enter the dev shell
ags types -d .                  # generate Gtk/Astal types
ags run entry.ts                # run the bar
ags run entry.ts defaults.toml  # run against a specific config file
nix build                       # build the package
nix run                         # run the built package
```

The dev shell exports `AGS_BAR_DATADIR`, so `defaults.toml` is found from the repository root.

## License

MIT

## Credits

Inspiration:
- [sameeul-haque](https://github.com/sameemul-haque/dotfiles)
- [brunoanesio](https://github.com/brunoanesio/waybar-config)
- [woioeow](https://github.com/woioeow/hyprland-dotfiles)

Built with [AGS](https://github.com/Aylur/ags) and [Astal](https://github.com/Aylur/astal).
