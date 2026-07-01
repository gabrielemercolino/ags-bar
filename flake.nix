{
  description = "My Ags bar";

  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs: import ./nix inputs;
}
