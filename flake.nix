{
  description = "My Ags bar";

  inputs = {
    nixpkgs.url = "nixpkgs/e7439b6b14ad3cc35d05608ebca9bce01a25f5f8";
    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.astal.follows = "astal";
    };

    # Pinned forward of ags v3.1.2's astal so we get the `workspace`
    # (ext-workspace-v1) and `wl` libraries, which that release predates.
    astal = {
      url = "github:aylur/astal/cbcd9f49dd6b9638dc5623b56cc6e1e0a60b593e";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs: import ./nix inputs;
}
