{
  description = "My Ags bar";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    ags,
    ...
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};

    astalPackages = with ags.packages.${system}; [
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

    extraPackages = astalPackages ++ [pkgs.gjs];

    ags' = ags.packages.${system}.default.override {
      inherit extraPackages;
    };
  in {
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
      default = pkgs.mkShell {
        buildInputs = [ags' pkgs.gjs];

        shellHook = ''
          echo
          echo "To generate node_modules 'ags types -d . -u'"
          echo "To generate types run 'ags types -d .'"
          echo "To run the bar 'ags run app.ts'"
          echo
        '';
      };
    };
  };
}
