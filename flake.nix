{
  description = "My Ags bar";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";

    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.astal.follows = "astal";
    };
  };

  outputs = {
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

    extraPackages = astalPackages ++ (with pkgs; [gjs]);
  in {
    packages.${system} = {
      default = pkgs.callPackage ./package.nix {inherit extraPackages ags;};
    };

    devShells.${system} = {
      default = pkgs.mkShell {
        buildInputs = [
          (ags.packages.${system}.default.override {
            inherit extraPackages;
          })
        ];

        shellHook = ''
          echo
          echo "To generate types run 'ags types -d .'"
          echo "To run the bar 'ags run app.ts'"
          echo
        '';
      };
    };
  };
}
