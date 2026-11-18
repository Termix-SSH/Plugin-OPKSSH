import path from "node:path";
import type { PluginBinarySpec } from "@termix-ssh/plugin-sdk/backend";

export const DEFAULT_VERSION = "v0.19.2";

const DEFAULT_CHECKSUMS: Record<string, string> = {
  "opkssh-linux-amd64":
    "e799b780d5477e8d986a2e6784773ebb2451d860dd842d23e271baf88aee2da3",
  "opkssh-linux-arm64":
    "4f31e47addec3b0beebef7d5d99d11e2d459b9a8e5298077879b2df34d13aedf",
  "opkssh-osx-amd64":
    "2be6cfbf59513834f04bfb1a69eb9a354be9530332a625b0b908e99336bc5aeb",
  "opkssh-osx-arm64":
    "20c7f8ef1e9563ad038b1884a38221e4aed7aea3dac20102fc8974234d6b982f",
  "opkssh-windows-amd64.exe":
    "a409d493957ecee78636f384f869317cda5093c41437ddb8713664d49c357158",
  "opkssh-windows-arm64.exe":
    "f946b9b1f450f1121b8e2259db196b5ba079a6529d4db1e59746b6a868ead968",
};

const OS_NAMES: Record<string, string> = {
  linux: "linux",
  darwin: "osx",
  win32: "windows",
};

const ARCH_NAMES: Record<string, string> = {
  x64: "amd64",
  arm64: "arm64",
};

/** The release asset name for this server, e.g. "opkssh-linux-amd64". */
export function binaryName(
  platform: string = process.platform,
  arch: string = process.arch,
): string {
  const os = OS_NAMES[platform] ?? platform;
  const cpu = ARCH_NAMES[arch] ?? arch;
  return `opkssh-${os}-${cpu}${platform === "win32" ? ".exe" : ""}`;
}

/**
 * What ctx.process.ensureBinary needs for OPKSSH.
 *
 * The pinned version is trusted by its built-in checksums. OPKSSH_VERSION
 * picks another release, and then OPKSSH_SHA256 (or OPKSSH_SHA256_AMD64 /
 * OPKSSH_SHA256_ARM64, which the Docker image passes on) gives its checksum.
 *
 * The Docker image bakes the binary into /app/opkssh-bundled (the
 * opkssh-downloader stage), which is checked first so an offline install
 * never downloads. OPKSSH_BUNDLED_DIR points somewhere else.
 */
export function binarySpec(
  env: NodeJS.ProcessEnv = process.env,
  platform: string = process.platform,
  arch: string = process.arch,
  cwd: string = process.cwd(),
): PluginBinarySpec {
  const name = binaryName(platform, arch);
  const version = env.OPKSSH_VERSION || DEFAULT_VERSION;
  const sha256 =
    version === DEFAULT_VERSION
      ? DEFAULT_CHECKSUMS[name]
      : (
          env.OPKSSH_SHA256 ||
          env[`OPKSSH_SHA256_${arch === "arm64" ? "ARM64" : "AMD64"}`]
        )
          ?.trim()
          .toLowerCase();
  if (!sha256 || !/^[0-9a-f]{64}$/.test(sha256)) {
    throw new Error(
      `OPKSSH ${version} has no trusted SHA-256 checksum for ${name}`,
    );
  }
  const bundledDir = env.OPKSSH_BUNDLED_DIR || path.join(cwd, "opkssh-bundled");
  return {
    name,
    version,
    sha256,
    url: `https://github.com/openpubkey/opkssh/releases/download/${version}/${name}`,
    prebuilt: [path.join(bundledDir, name)],
  };
}
