{
  self,
  nixpkgs,
  ags,
  ...
}:
let
  system = "x86_64-linux";
  pkgs = import nixpkgs { inherit system; };

  extraPackages = with ags.packages.${system}; [
    io
    astal4
    hyprland
    network
    bluetooth
    wireplumber
    battery
    tray
    notifd
  ];

  devPackages = with pkgs; [
    typescript-language-server
    nodejs
    taplo
    yq
    inotify-tools
  ];

  ags' = ags.packages.${system}.default.override { inherit extraPackages; };
in
{
  packages.${system} = {
    default = pkgs.callPackage ./package.nix {
      inherit extraPackages;
      gitRev = self.rev or "dirty";
      ags = ags';
    };
  };

  homeManagerModules.default = import ./home-module.nix {
    basePackage = self.packages.${system}.default;
  };

  devShells.${system} = {
    default = pkgs.mkShellNoCC {
      buildInputs = [
        ags'
        pkgs.gjs
      ]
      ++ devPackages;

      shellHook = ''
        echo
        echo "To generate node_modules 'ags types -d . -u'"
        echo "To generate types run 'ags types -d .'"
        echo "To run the bar 'ags run app.ts'"
        echo "To generate dev schema 'npm run gen-schema --silent > schema.json'"
        echo

        export AGS_BAR_DATADIR=$(pwd)
      '';
    };
  };
}
