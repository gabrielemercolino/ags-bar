{
  pkgs,
  astal-wl,
}:
let
  wl-vapi-gen = pkgs.stdenv.mkDerivation {
    pname = "wl-vapi-gen";
    version = "1.0.0";
    src = pkgs.fetchFromGitHub {
      owner = "kotontrion";
      repo = "wl-vapi-gen";
      rev = "1.0.0";
      hash = "sha256-XdgYmxW0ndH6szq7VJ+XQEnWKHCyaWoBwEQREZnTm98=";
    };

    nativeBuildInputs = with pkgs; [
      meson
      ninja
      python3
    ];

    patchPhase = ''
      patchShebangs wl-vapi-gen.py
    '';
  };
in
pkgs.stdenv.mkDerivation {
  pname = "astal-toplevel";
  version = "0.1.0";
  src = ./.;

  nativeBuildInputs = with pkgs; [
    meson
    ninja
    pkg-config
    vala
    gobject-introspection
    wayland
    wayland-scanner
    python3
    wl-vapi-gen
  ];

  buildInputs = with pkgs; [
    astal-wl
    glib
  ];

  meta = {
    description = "Astal wlr-foreign-toplevel-management library";
    license = pkgs.lib.licenses.lgpl21;
    platforms = pkgs.lib.platforms.linux;
  };
}
