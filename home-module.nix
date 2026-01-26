{basePackage}: {
  config,
  lib,
  ...
}:
with lib; let
  cfg = config.programs.ags-bar;

  agsBarPackage = basePackage.override {
    inherit (cfg) colors fonts commands;
  };
in {
  options.programs.ags-bar = {
    enable = mkEnableOption "AGS bar";

    colors = {
      base16 = mkOption {
        type = types.attrsOf types.anything;
        default = {};
        description = "Base16 colors to use";
      };

      overrides = mkOption {
        type = types.attrsOf types.anything;
        default = {};
        description = "color overrides";
      };
    };

    fonts = mkOption {
      type = types.listOf (types.either types.str (
        types.addCheck types.attrs (x: x ? name)
        // {description = "package or set with 'name'";}
      ));
      default = [];
      description = "Fonts to use";
    };

    commands = mkOption {
      type = types.attrsOf types.str;
      default = {};
      description = "Custom commands";
    };

    systemd.enable = mkEnableOption "systemd integration";
  };

  config = mkIf cfg.enable {
    home.packages = [agsBarPackage];

    systemd.user.services.ags-bar = mkIf cfg.systemd.enable {
      Unit = {
        Description = "AGS Bar";
        PartOf = ["graphical-session.target"];
      };

      Service = {
        ExecStart = "${agsBarPackage}/bin/ags-bar";
        Restart = "on-failure";
        RestartSec = 3;
      };

      Install.WantedBy = ["graphical-session.target"];
    };
  };
}
