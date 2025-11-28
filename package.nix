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

  flattenAttrs = prefix: attrs:
    lib.concatLists (
      lib.mapAttrsToList (
        name: value: let
          newPrefix = prefix ++ [name];
        in
          if lib.isAttrs value && !lib.isDerivation value
          then flattenAttrs newPrefix value
          else [
            {
              path = newPrefix;
              inherit value;
            }
          ]
      )
      attrs
    );

  pathToScssVar = path: "$" + (lib.concatStringsSep "-" path);

  modulesSubstitutions =
    if colors ? overrides
    then
      lib.concatStringsSep "\n" (
        lib.mapAttrsToList (
          moduleName: moduleAttrs: let
            flattened = flattenAttrs [] moduleAttrs;
          in
            lib.concatStringsSep "\n" (
              map (
                item: let
                  varName = pathToScssVar item.path;
                in ''sed -i "0,/${varName}:/s|${varName}: .*|${varName}: ${item.value};|" "styles/${moduleName}.scss"''
              )
              flattened
            )
        )
        colors.overrides
      )
    else "";

  base16Substitutions =
    if colors ? base16
    then
      lib.concatStringsSep "\n" (
        lib.mapAttrsToList (
          name: value: let
            varName = "$" + name; # nix escapes the interpolation with `$${name}`
          in ''sed -i '0,/\${varName}:/s|\${varName}: .*|\${varName}: ${value};|' "styles/colors.scss"''
        )
        (lib.filterAttrs (
            name: _value:
              lib.hasPrefix "base" name
          )
          colors.base16)
      )
    else "";

  fontFamilyStr = lib.concatStringsSep ", " (map (f:
    if lib.isString f
    then f
    else f.name)
  fonts);

  fontSubstitution = lib.optionalString (fonts != []) ''
    sed -i '0,/\$font-families:/s|\$font-families: .*|\$font-families: "${fontFamilyStr}";|' "styles/style.scss"
  '';

  commandSubstitutions = lib.concatStringsSep "\n" (
    lib.mapAttrsToList (
      name: value: let
        constName = "${lib.toUpper name}_COMMAND"; # Convert audio -> AUDIO_COMMAND
      in ''sed -i '0,/const ${constName} =/s|const ${constName} = .*|const ${constName} = "${value}"|' "commands.ts"''
    )
    commands
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
