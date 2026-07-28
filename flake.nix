{
  description = "My Ags bar";

  inputs = {
    nixpkgs.url = "nixpkgs/70ce234312134a463ba7728e94da2486a1d237ac";
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs: import ./nix inputs;
}
