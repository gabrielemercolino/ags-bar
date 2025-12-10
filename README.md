# AGS Bar

My status bar for Hyprland built with [AGS](https://github.com/Aylur/ags).

## Features

- **Modular Design**: Workspaces, window title, system tray, audio, battery,
  bluetooth, notifications, and clock widgets
- **Full Nix Integration**: Declarative configuration
- **Themeable**: Base16 color scheme support with granular per-module overrides
- **Stylix Compatible**: Seamless integration with Stylix for automatic theming

## Requirements

This flake requires Nix with experimental features enabled:

- `pipe-operators`

Add to your `configuration.nix`:

```nix
{
  nix.settings = {
    experimental-features = ["pipe-operators"];
  };
}
```

Or use `--extra-experimental-features pipe-operators` when building.

## Installation

### Using Flakes

Add to your `flake.nix`:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    ags-bar.url = "github:gabrielemercolino/ags-bar";
    ags-bar.inputs.nixpkgs.follows = "nixpkgs"; # optional but recommended
  };
}
```

Then, in your `configuration.nix`:

```nix
{
  environment.systemPackages = [
    inputs.ags-bar.packages.${system}.default
  ];
}
```

Or in your `home.nix`:

```nix
{
  home.packages = [
    inputs.ags-bar.packages.${system}.default
  ];
}
```

## Configuration

The configuration is done by overriding the package:

```nix
inputs.ags-bar.packages.${system}.default.override = {
  # some widgets can execute programs on click, check commands.ts
  commands = {
    lock = "${pkgs.swaylock-effects}/bin/swaylock";
  };

  # you can add different fonts
  # the order defines the priority
  # also note that you need to properly install fonts or they might not work
  fonts = [
    config.stylix.fonts.monospace # you can pass fonts from stylix,
    pkgs.fira-code                # a package
    "Fira Code"                   # or the name directly
  ];

  colors = {
    # if you use stylix
    base16 = config.lib.stylix.colors.withHashtag;

    # you can also manually set them
    base16 = {
      base00 = "#123456";
      # ... other base16 colors
    };

    # overrides have higher priority than base16 colors
    overrides = {
      # Override colors in styles/apps.scss
      apps = {
        notifications = {
          popup = {
            app = {
              foreground = "rgba(10, 50, 10, 1.0)";
              outline = "#ff0000";
            };
          };
        };
      };
    };
  };
};
```

The structure under `overrides.<module>` maps directly to SCSS variable names:

- `apps.notifications.popup.app.outline` → `$notifications-popup-app-outline`
  in `styles/apps.scss`

## Widgets

### Available Widgets

- **Power Controls**: Shutdown, reboot, and lock buttons (see commands)
- **System Tray**: Application indicators with click support
- **Workspaces**: Hyprland workspace switcher (by default a minimum of 3 are shown)
- **Window Title**: Shows the active window's initial title
- **Network**: WiFi status and signal strength or wired connection
- **Bluetooth**: Bluetooth control and device list with connect/disconnect/pair functionality
- **Microphone & Speaker**: Volume control with popups
- **Battery**: Battery percentage and charging status (not shown if not present)
- **Date & Clock**: Date with calendar popup and time display
- **Notifications**: Grouped notification center with click & dismiss actions

### Bluetooth Usage

The Bluetooth widget requires the `bluez` service to be enabled:

```nix
# configuration.nix
hardware.bluetooth.enable = true;
```

### Notifications

Notifications are grouped by application and summary. The notification center automatically:

- Groups notifications by app name and summary
- Supports markup in notification bodies
- Allows dismissing individual notification groups
- Scrolls when there are many notifications

## Styling

The bar uses SCSS for styling, organized into modules:

- `styles/style.scss` - Main stylesheet
- `styles/colors.scss` - Base16 color definitions
- `styles/apps.scss` - Notifications and tray styling
- `styles/bluetooth.scss` - Bluetooth widget styling
- ... (other modules)

## Hot reloading

Hot reloading is not provided but for _home-manager_ it can be added at switch
with something like this

```nix
# home.nix
let
  bar = inputs.ags-bar.packages.${system}.default;
in
{
  home.packages = [bar];

  # checks if the derivation changed and restarts if that's the case
  home.activation.ags-bar = lib.hm.dag.entryAfter ["writeBoundary"] ''
    old_path="${config.home.homeDirectory}/.local/state/ags-bar-path"
    new_path="${bar}"

    if [ -f "$old_path" ] && [ "$(cat "$old_path")" = "$new_path" ]; then
      echo "not restarting ags-bar"
    else
      echo "$new_path" > "$old_path"
      echo "restarting ags-bar"
      ${pkgs.procps}/bin/pkill gjs 2> /dev/null || true
      ${lib.getExe bar} > /dev/null 2> /dev/null &
    fi
  '';

  # or you can just reload it every time
  home.activation.ags-bar-simple = lib.hm.dag.entryAfter ["writeBoundary"] ''
    ${pkgs.procps}/bin/pkill gjs 2> /dev/null || true
    ${lib.getExe bar} > /dev/null 2> /dev/null &
  '';
}
```

## Development

### Generate types

```sh
ags types -d . -u # also (re)generates node_modules
ags types -d .
```

### Building from Source

```sh
nix build
```

### Development Shell

```sh
nix develop
```

### Testing

```sh
ags run app.ts  # just run without packaging, useful when changing stuff

nix run         # build and run the derivation
```

### Project Structure

```
.
├── app.ts             # Main entry point
├── commands.ts        # Command constants
├── widget/            # Widgets
│   ├── apps/          # Apps-specific widgets
│   └── ...
├── components/        # Some components
│   └── ...
├── styles/            # SCSS stylesheets
│   ├── style.scss
│   ├── colors.scss
│   └── ...
├── package.nix        # Package derivation
├── flake.nix          # Flake configuration
└── ...                # Other files
```

## Troubleshooting

### Colors not applying

Ensure your color overrides match the structure in the SCSS files.
Check the variable names in `styles/<module>.scss` to verify the correct path.

### Fonts not showing

Make sure fonts are installed system-wide via `fonts.packages` in your NixOS configuration.
The bar only references font names, it doesn't install them.

## License

MIT

## Credits

Inspiration for the bar:

- [sameeul-haque](https://github.com/sameemul-haque/dotfiles)
- [brunoanesio](https://github.com/brunoanesio/waybar-config)
- [woioeow](https://github.com/woioeow/hyprland-dotfiles)

Built with:

- [AGS](https://github.com/Aylur/ags) - Astal GJS framework
- [Astal](https://github.com/Aylur/astal) - Widget libraries
