{ basePackage }:
{
  config,
  lib,
  pkgs,
  ...
}:
let
  inherit (lib) mkOption mkEnableOption mkIf;
  inherit (lib.types) package anything;
  cfg = config.programs.ags-bar;
  tomlFormat = pkgs.formats.toml {};
in
{
  options.programs.ags-bar = {
    enable = mkEnableOption "AGS bar";

    package = mkOption {
      type = package;
      default = basePackage;
      readOnly = true;
      internal = true;
    };

    settings = mkOption {
      type = anything;
      default = {};
      description = "Configuration written to ~/.config/ags-bar/config.toml.";
    };

    systemd.enable = mkEnableOption "systemd integration";
  };

  config = mkIf cfg.enable {
    home.packages = [ cfg.package ];

    xdg.configFile."ags-bar/config.toml" = mkIf (cfg.settings != {}) {
      source = tomlFormat.generate "ags-bar-config" cfg.settings;
    };

    systemd.user.services.ags-bar = mkIf cfg.systemd.enable {
      Unit = {
        Description = "AGS Bar";
        PartOf = [ config.wayland.systemd.target ];
        After = [ config.wayland.systemd.target ];
        ConditionEnvironment = "WAYLAND_DISPLAY";
      };

      Service = {
        ExecStart = "${cfg.package}/bin/ags-bar";
        Restart = "on-failure";
        RestartSec = 3;
      };

      Install.WantedBy = [ config.wayland.systemd.target ];
    };
  };
}
