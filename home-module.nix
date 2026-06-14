{ basePackage }:
{
  config,
  lib,
  ...
}:
let
  inherit (lib) mkOption mkEnableOption mkIf;
  inherit (lib.types) package;
  cfg = config.programs.ags-bar;
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

    systemd.enable = mkEnableOption "systemd integration";
  };

  config = mkIf cfg.enable {
    home.packages = [ cfg.package ];

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
