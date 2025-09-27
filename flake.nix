{
  description = "Rust + Anchor + TS";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            rustup
            pkg-config
            openssl
            llvmPackages.libclang
            cmake

            nodejs
            nodePackages.npm
            nodePackages.yarn

            solana-cli
            anchor-cli
          ];

          shellHook = ''
            rustup default stable
            rustup target add bpfel-unknown-unknown
            '';
        };
      });
}
