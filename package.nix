{
  lib,
  ags,
  pkgs,
  extraPackages,
  gitRev ? "unknown",
}:
let
  pname = "ags-bar";
  entry = "entry.ts";
in
pkgs.stdenv.mkDerivation {
  inherit pname;
  src = ./.;
  version = gitRev;

  nativeBuildInputs = with pkgs; [
    wrapGAppsHook4
    gobject-introspection
    ags
  ];

  buildInputs = extraPackages;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin $out/share
    cp defaults.toml $out/share/

    ags bundle ${entry} $out/bin/${pname}

    runHook postInstall
  '';

  postFixup = ''
    wrapProgram $out/bin/${pname} \
      --add-flags "$out/share/defaults.toml"
  '';

  meta = {
    description = "Custom AGS bar";
    license = lib.licenses.mit;
    mainProgram = pname;
  };
}
