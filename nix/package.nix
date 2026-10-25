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
  src = ../.;
  version = gitRev;

  nativeBuildInputs = with pkgs; [
    wrapGAppsHook4
    gobject-introspection
    ags
  ];

  buildInputs = extraPackages;

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin $out/share/${pname}
    cp defaults.toml icons.toml $out/share/${pname}

    ags bundle ${entry} $out/bin/${pname}

    runHook postInstall
  '';

  postFixup = ''
    wrapProgram $out/bin/${pname} \
      --prefix XDG_DATA_DIRS : ${placeholder "out"}/share \
      --prefix PATH : ${lib.makeBinPath [ pkgs.yq ]}
  '';

  meta = {
    description = "Custom AGS bar";
    license = lib.licenses.mit;
    mainProgram = pname;
  };
}
