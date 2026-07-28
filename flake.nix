{
  description = "My Ags bar";

  inputs = {
    nixpkgs.url = "nixpkgs/e7439b6b14ad3cc35d05608ebca9bce01a25f5f8";
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs: import ./nix inputs;
}
