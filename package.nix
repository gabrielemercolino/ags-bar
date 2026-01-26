{
  lib,
  ags,
  pkgs,
  extraPackages,
  colors ? {},
  commands ? {},
  fonts ? [],
  gitRev ? "unknown",
}: let
  entry = "app.ts";
  pname = "ags-bar";
  system = pkgs.stdenv.hostPlatform.system;

  # Generate sed command to replace an SCSS variable
  makeSedSubstitution = file: varName: value: ''sed -i '0,/${varName}:/s|${varName}: .*|${varName}: ${value};|' '${file}' '';

  # Generate sed command to replace a TypeScript constant
  makeCommandSubstitution = file: constName: value: ''sed -i '0,/const ${constName} =/s|const ${constName} = .*|const ${constName} = "${value}"|' "${file}"'';

  # Converts path to SCSS variable: ["a", "b", "c"] -> "$a-b-c"
  pathToScssVar = path:
    path
    |> lib.concatStringsSep "-"
    |> (name: "$" + name);

  # Flatten nested attribute set into list of path-value pairs
  # { a.b.c = "x"; } -> [ { path = ["a" "b" "c"]; value = "x"; } ]
  flattenAttrs = prefix: attrs:
    attrs
    |> lib.mapAttrsToList (name: value: {
      path = prefix ++ [name];
      inherit value;
      isNested = lib.isAttrs value && !lib.isDerivation value;
    })
    |> lib.concatMap (
      item:
        if item.isNested
        then flattenAttrs item.path item.value
        else [{inherit (item) path value;}]
    );

  # Generate substitutions for module-specific overrides
  modulesSubstitutions =
    colors.overrides or {}
    |> lib.mapAttrsToList (
      moduleName: moduleAttrs:
        moduleAttrs
        |> flattenAttrs []
        |> map (
          item:
            makeSedSubstitution "styles/${moduleName}.scss" (pathToScssVar item.path) item.value
        )
        |> lib.concatStringsSep "\n"
    )
    |> lib.concatStringsSep "\n";

  # Generate base16 color substitutions
  base16Substitutions =
    colors.base16 or {}
    |> lib.filterAttrs (name: _: lib.hasPrefix "base" name)
    |> lib.mapAttrsToList (
      name: value:
        makeSedSubstitution "styles/colors.scss" ("$" + name) value
    )
    |> lib.concatStringsSep "\n";

  # Generate font family substitution
  fontSubstitution =
    fonts
    |> map (f:
      if lib.isString f
      then f
      else f.name)
    |> lib.concatStringsSep ", "
    |> (
      families:
        lib.optionalString (fonts != [])
        (makeSedSubstitution "styles/style.scss" "$font-families" families)
    );

  # Generate command substitutions
  commandSubstitutions =
    commands
    |> lib.mapAttrsToList (
      name: value:
        makeCommandSubstitution "commands.ts" "${lib.toUpper name}_COMMAND" value
    )
    |> lib.concatStringsSep "\n";
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

      ${base16Substitutions}
      ${modulesSubstitutions}
      ${fontSubstitution}
      ${commandSubstitutions}


      ags bundle ${entry} $out/bin/${pname} -d "SRC='.'"

      runHook postInstall
    '';

    meta = {
      description = "Custom AGS bar";
      license = lib.licenses.mit;
      mainProgram = pname;
    };
  }
