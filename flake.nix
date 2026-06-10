{
  description = "My Ags bar";

  nixConfig = {
    extra-substituters = [ "https://ags.cachix.org" ];
    extra-trusted-public-keys = [ "ags.cachix.org-1:naAvMrz0CuYqeyGNyLgE010iUiuf/qx6kYrUv3NwAJ8=" ];
  };

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
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
        # python
        python3
        python3Packages.pydantic
        ty
        # ts
        typescript-language-server
        # toml
        taplo
        yq
        # utility
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
        default = pkgs.mkShell {
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
            echo
          '';
        };
      };
    };
}
