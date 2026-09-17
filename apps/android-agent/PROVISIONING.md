# Open MDM Agent — Provisioning & Dev Guide

Android agent provisioned as **Device Owner** (custom DPC). First cut covers:
pinned-key enrollment, periodic heartbeat and device inventory. Remote commands
and policy enforcement are not implemented yet (the device-admin policies are
declared up front in `res/xml/device_admin_policies.xml` for that follow-up
work).

## Architecture (first cut)

```
MdmAgentApp (Application)
  └─ AppContainer (manual DI)
       ├─ SecureDeviceStore        EncryptedSharedPreferences: deviceId + device JWT + baseUrl
       ├─ DeviceKeyStore           AndroidKeyStore EC key pair (secp256r1), generated once, persisted
       ├─ DeviceApi                Retrofit (real) or MockDeviceApi (BuildConfig.USE_MOCK)
       ├─ InventoryCollector       model/brand/OS/serial/androidId/storage/battery/apps/agent version
       └─ DeviceRepository         challenge → sign → enroll → inventory → heartbeat
  └─ WorkManager (MdmWorkerFactory)
       ├─ EnrollWorker             one-off, triggered by provisioning callback or manual UI
       └─ HeartbeatWorker          periodic (15 min) + BootReceiver re-arm
security/
  ├─ CanonicalMessage              builds the pipe-separated message signed at enrollment
  └─ EcdsaSigner                   SHA256withECDSA (DER) signing/verification over a PrivateKey/PublicKey
device/
  ├─ MdmDeviceAdminReceiver        onProfileProvisioningComplete → reads serverBaseUrl → enqueues enroll
  └─ DeviceOwnerManager            isDeviceOwner / isAdminActive
ui/ AgentScreen + AgentViewModel   status + enroll (tap or QR scan), no token entry
```

### Deviations from the original plan (toolchain-forced)

The project is on a bleeding-edge toolchain (AGP 9.2.1 / Kotlin 2.2.10 with
AGP's built-in Kotlin). Two planned libraries are incompatible with it and were
dropped:

- **Hilt** — its Gradle plugin fails on AGP 9 (`Android BaseExtension not
  found`). Replaced by a hand-wired `AppContainer` + a custom `WorkerFactory`.
- **Room + KSP** — KSP breaks on AGP built-in Kotlin (`kotlin.sourceSets DSL …
  not allowed`). Not needed yet anyway; identity is stored in
  `EncryptedSharedPreferences`. Reintroduce Room when the local command queue
  lands and the KSP/AGP9 story stabilizes.

The scaffold's androidx versions required `compileSdk 37` (not installed); they
were pinned down to `compileSdk 36`-compatible versions in `libs.versions.toml`.

If Android Studio complains that it only supports an older AGP than the one
pinned in `gradle/libs.versions.toml`, that's a local IDE/AGP mismatch, not a
project issue — update Android Studio, or temporarily pin `agp` down to what
your IDE supports (Gradle 9.4.1, the wrapper version, comfortably supports
either).

## Build

```bash
cd apps/android-agent
./gradlew :app:assembleDebug      # APK at app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:testDebugUnitTest  # wire-contract + crypto tests (MockWebServer, JVM-only EC keys)
```

`BuildConfig.USE_MOCK` defaults to **false** — the agent talks to a real
backend at `BuildConfig.MDM_SERVER_URL` (default `http://10.192.2.120:5573/`,
set in `app/build.gradle.kts`) unless overridden by a `serverBaseUrl` received
via QR provisioning. Set `USE_MOCK` to `true` to run the full
enroll/heartbeat/inventory flow against `MockDeviceApi` without any backend.

> Stable signing identity for QR provisioning lives in `keystore/mdm-dev.jks`
> (dev-only, committed on purpose so the signature checksum is constant).

## Wire contract (implemented server-side, see `apps/api/src/features/enrollment` and `apps/api/src/features/device`)

There is **no admin-issued enrollment token**. A single-use, short-lived
challenge (fetched live, right before enrolling) is the sole authorization,
and the device proves possession of its own Keystore key by signing a
canonical message that binds its identity to that challenge — a re-enrollment
of a known `androidId` must present the same `publicKey` it enrolled with the
first time, or the server rejects it (`400`).

```
GET  /api/v1/enrollment/challenge      -> { challenge, ttlSeconds, expiresAt }

POST /api/v1/devices/enroll            { challenge, timestamp, signature, device }
                                       -> { deviceId, deviceToken }            # deviceToken = device JWT

POST /api/v1/devices/{id}/heartbeat    Bearer deviceToken | { battery, storageFreeBytes, online, ts } -> { ok }
POST /api/v1/devices/{id}/inventory    Bearer deviceToken | { os, model, manufacturer, serial, storage, apps[] } -> { ok }
```

`device` (see `DeviceInfoDto`) — only `model`/`manufacturer`/`osVersion`/
`publicKey` are required, the rest is best-effort and omitted (never sent as
JSON `null`) when unreadable:

```
androidId, brand, model, manufacturer, osVersion, serial, imei, macAddress,
ipAddress, enrollmentStatus, enrollmentMethod ("qr"|"manual"|"usb"), publicKey,
agentPackage, agentVersionName, agentVersionCode
```

`agentPackage`/`agentVersionName`/`agentVersionCode` are the agent APK's own
identity (`context.packageName` + `PackageInfo.versionName`/`longVersionCode`),
read by `InventoryCollector` and sent on every enrollment — lets the server
tell which build of the agent a device is running.

`signature` = ECDSA/SHA-256 (DER-encoded, `Signature.getInstance("SHA256withECDSA")`),
base64-encoded, over the canonical message built by `CanonicalMessage.build(...)`:

```
model|manufacturer|osVersion|serialNumber|imei|macAddress|androidId|method|timestamp|publicKey|challenge
```

(pipe-separated, exact field order, missing optional values as `""`). The
private key never leaves the Android Keystore (`DeviceKeyStore`, EC/secp256r1,
alias generated once and reused for the app's lifetime — regenerating it would
break re-enrollment against the server's pinned key).

## Provisioning A — QR code (production path)

On a factory-reset device, tap the welcome screen 6×, then scan a QR encoding
this JSON. Host `app-debug.apk` at an HTTPS URL reachable by the device.

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
    "com.openmdm.agent/com.openmdm.agent.device.MdmDeviceAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
    "https://YOUR_HOST/app-debug.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM":
    "uvZWxNiL69K71LKebOhMCv8Jecs7RD5U7yMm5LsRDCw",
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "serverBaseUrl": "https://YOUR_MDM_SERVER/"
  },
  "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false
}
```

- The checksum above is the URL-safe base64 SHA-256 of `keystore/mdm-dev.jks`'s
  signing certificate. Regenerate it whenever the signing key changes:
  ```bash
  keytool -exportcert -keystore keystore/mdm-dev.jks -alias mdmdev -storepass mdmdevpass \
    | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '='
  ```
- The server deliberately does **not** embed a challenge in this payload (see
  `buildProvisioningPayload`): its TTL (120s by default) would easily be
  outlived by Device Owner provisioning (wipe + DPC install + boot), so a
  pre-baked one would likely already be expired or consumed by the time the
  agent starts. On success, `onProfileProvisioningComplete` reads only
  `serverBaseUrl` from the extras and enqueues `EnrollWorker`, which fetches a
  fresh challenge itself right before enrolling — exactly like the manual UI
  path below.

## Provisioning B — ADB (dev, no factory reset of QR flow)

The device/emulator must have no accounts and no other device owner.

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
adb shell dpm set-device-owner com.openmdm.agent/com.openmdm.agent.device.MdmDeviceAdminReceiver
adb shell dumpsys device_policy | grep -i "Device Owner"   # verify
```

ADB `set-device-owner` does **not** deliver provisioning extras. Enroll from
the app itself: no code to enter — tap **Enrôler** (uses the compiled-in
`BuildConfig.MDM_SERVER_URL`), or **Scanner** a QR carrying `serverBaseUrl` if
pointing at a non-default server. Either arms the periodic heartbeat on
success.

## Verify the flow

1. Launch the app → status card shows `Device Owner: yes` after Provisioning B.
2. Tap **Enrôler** (or scan a QR) → `Enrolled: yes` and a `Device id` appear.
   Re-launching and enrolling again re-uses the same Keystore key pair and
   re-enrolls the same device record (same `deviceId`) rather than failing or
   creating a duplicate.
3. Tap **Heartbeat** / **Inventory** → with `USE_MOCK=true` they succeed
   immediately; with a real backend, watch the OkHttp logs / server.
