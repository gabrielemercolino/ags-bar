{
  lib,
  ags,
  pkgs,
  extraPackages,
  colors ? {},
  gitRev ? "unknown",
}: let
  entry = "app.ts";
  pname = "ags-bar";
  system = pkgs.stdenv.hostPlatform.system;

  colorSubstitutions = lib.concatStringsSep "\n" (
    lib.mapAttrsToList (
      name: value: let
        varName = "$" + name; # nix escapes the interpolation with `$${name}`
      in ''sed -i '0,/\${varName}:/s|\${varName}: .*|\${varName}: ${value};|' "style.scss"''
    )
    colors
  );
in
  pkgs.stdenv.mkDerivation {
    inherit pname;
    src = ./.;
    version = lib.substring 0 8 gitRev;

    nativeBuildInputs = with pkgs; [
      wrapGAppsHook3
      gobject-introspection
      ags.packages.${system}.default
    ];

    buildInputs = extraPackages;

    passthru = {
      inherit colors;
    };

    installPhase = ''
      runHook preInstall

      mkdir -p $out/bin
      mkdir -p $out/share
      cp -r * $out/share

      ${colorSubstitutions}

      ags bundle ${entry} $out/bin/${pname} -d "SRC='$out/share'"

      runHook postInstall
    '';

    meta = {
      description = "Custom AGS bar";
      license = lib.licenses.mit;
      mainProgram = pname;
    };
  }
