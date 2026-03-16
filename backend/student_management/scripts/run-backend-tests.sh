#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

required_major=9

run_with_local_gradle() {
  local gradle_bin="$1"
  echo "[info] Using local Gradle installation: $gradle_bin"
  "$gradle_bin" --no-daemon test
}

run_with_wrapper_default() {
  echo "[info] Using Gradle wrapper default distribution"
  bash ./gradlew --no-daemon test
}

run_with_wrapper_file_distribution() {
  local dist_file="$1"

  if [[ ! -f "$dist_file" ]]; then
    echo "[error] GRADLE_DISTRIBUTION_FILE does not exist: $dist_file" >&2
    exit 1
  fi

  local props_file="$ROOT_DIR/gradle/wrapper/gradle-wrapper.properties"
  local backup_file
  backup_file="$(mktemp)"
  cp "$props_file" "$backup_file"
  trap 'cp "$backup_file" "$props_file"; rm -f "$backup_file"' EXIT

  local abs_path
  abs_path="$(cd "$(dirname "$dist_file")" && pwd)/$(basename "$dist_file")"
  local file_url="file://${abs_path}"

  python - "$props_file" "$file_url" <<'PY'
from pathlib import Path
import sys

props_path = Path(sys.argv[1])
file_url = sys.argv[2]
text = props_path.read_text()
text = text.replace(
    "distributionUrl=https\\://services.gradle.org/distributions/gradle-9.3.1-bin.zip",
    f"distributionUrl={file_url}",
)
props_path.write_text(text)
PY

  echo "[info] Using Gradle wrapper with local distribution file: $abs_path"
  bash ./gradlew --no-daemon test
}

gradle_major_version() {
  local gradle_bin="$1"
  "$gradle_bin" --version | awk '/^Gradle / {split($2,v,"."); print v[1]; exit}'
}

if [[ -n "${GRADLE_DISTRIBUTION_FILE:-}" ]]; then
  run_with_wrapper_file_distribution "$GRADLE_DISTRIBUTION_FILE"
  exit 0
fi

if command -v gradle >/dev/null 2>&1; then
  local_major="$(gradle_major_version gradle || true)"
  if [[ -n "$local_major" && "$local_major" -ge "$required_major" ]]; then
    run_with_local_gradle gradle
    exit 0
  fi
  echo "[warn] Local Gradle major version is ${local_major:-unknown}; this project needs Gradle ${required_major}+ (wrapper is 9.3.1)."
fi

# Final attempt - wrapper default (requires open network/proxy access)
run_with_wrapper_default
