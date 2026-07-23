{
  description = "My Ags bar";

  inputs = {
    nixpkgs.url = "nixpkgs/421eebfd0ec7bccd4abe826ce62d7e6e83129493";
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs: import ./nix inputs;
}
