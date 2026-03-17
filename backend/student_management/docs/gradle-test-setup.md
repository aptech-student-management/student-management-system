# Backend test setup when Gradle wrapper download is blocked

If `./gradlew test` fails with proxy/network errors while downloading Gradle distribution,
use one of these options.

## Option 1 — Use local Gradle installation (recommended)

1. Install Gradle locally (same major version is preferred).
2. Run tests using the helper script:

```bash
cd backend/student_management
./scripts/run-backend-tests.sh
```

The script automatically prefers local `gradle` if available.

## Option 2 — Use an offline Gradle distribution zip file

1. Download Gradle distribution zip once (example: `gradle-9.3.1-bin.zip`) from a machine that has internet.
2. Copy the zip to your current machine (for example: `/opt/tools/gradle-9.3.1-bin.zip`).
3. Run:

```bash
cd backend/student_management
GRADLE_DISTRIBUTION_FILE=/opt/tools/gradle-9.3.1-bin.zip ./scripts/run-backend-tests.sh
```

The script temporarily rewrites `gradle/wrapper/gradle-wrapper.properties` to `file://...`
and restores it after running tests.

## Option 3 — Keep using wrapper via proxy

If your network requires proxy for Java/Gradle, add proxy JVM args when running:

```bash
cd backend/student_management
./gradlew test \
  -Dhttps.proxyHost=<proxy-host> \
  -Dhttps.proxyPort=<proxy-port> \
  -Dhttp.proxyHost=<proxy-host> \
  -Dhttp.proxyPort=<proxy-port>
```

If your proxy requires authentication, also add:

- `-Dhttps.proxyUser=<user>`
- `-Dhttps.proxyPassword=<password>`

## Quick verify

```bash
cd backend/student_management
./scripts/run-backend-tests.sh
```

