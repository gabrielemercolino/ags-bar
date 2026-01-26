# AGS Bar

My status bar for Hyprland built with [AGS](https://github.com/Aylur/ags).

## Features

- **Modular Design**: Workspaces, window title, system tray, audio, battery, bluetooth, notifications, and clock widgets
- **Full Nix Integration**: Declarative home-manager module
- **Themeable**: Base16 color scheme support with granular per-module overrides
- **Stylix Compatible**: Seamless integration with Stylix for automatic theming

## Requirements

This flake requires the `pipe-operators` experimental feature. Add to your `configuration.nix`:
```nix
nix.settings.experimental-features = ["pipe-operators"];
```

## Installation

Add to your `flake.nix`:
```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    ags-bar.url = "github:gabrielemercolino/ags-bar";
    ags-bar.inputs.nixpkgs.follows = "nixpkgs";
  };
}
```

Import the home-manager module:
```nix
imports = [
  inputs.ags-bar.homeManagerModules.default
];
```

## Configuration
```nix
programs.ags-bar = {
  enable = true;
  systemd.enable = true;

  # Widget commands
  commands = {
    lock = "${pkgs.swaylock-effects}/bin/swaylock";
  };

  # Font configuration
  fonts = [
    config.stylix.fonts.monospace  # from stylix
    pkgs.fira-code                 # package
    "Fira Code"                    # or name directly
  ];

  # Color configuration
  colors = {
    # Base16 scheme
    base16 = config.lib.stylix.colors.withHashtag;
    # or manually:
    # base16.base00 = "#123456";

    # Per-module overrides
    overrides = {
      apps.notifications.popup.app = {
        foreground = "rgba(10, 50, 10, 1.0)";
        outline = "#ff0000";
      };
    };
  };
};
```

Color overrides map to SCSS variables: `apps.notifications.popup.app.outline` → `$apps-notifications-popup-app-outline` in `styles/apps.scss`.

The bar automatically restarts on configuration changes via systemd if enabled.

## Widgets

- **Power Controls**: Shutdown, reboot, lock buttons
- **System Tray**: Application indicators
- **Workspaces**: Hyprland workspace switcher
- **Window Title**: Active window title
- **Network**: WiFi/Ethernet status
- **Bluetooth**: Device management with connect/disconnect
- **Audio**: Volume control with popups
- **Battery**: Charge level and status
- **Clock**: Time and calendar popup
- **Notifications**: Grouped notification center

### Bluetooth

Requires `hardware.bluetooth.enable = true;` in your NixOS configuration.

## Development
```sh
# Generate types
ags types -d .

# Test without building
ags run app.ts

# Build
nix build

# Run
nix run
```

## License

MIT

## Credits

Inspiration: [sameeul-haque](https://github.com/sameemul-haque/dotfiles), [brunoanesio](https://github.com/brunoanesio/waybar-config), [woioeow](https://github.com/woioeow/hyprland-dotfiles)

Built with [AGS](https://github.com/Aylur/ags) and [Astal](https://github.com/Aylur/astal).
