# Open MDM Agent — Provisioning & Dev Guide

Android agent provisioned as **Device Owner** (custom DPC). First cut covers:
enrollment, periodic heartbeat and device inventory. Remote commands and policy
enforcement are not implemented yet (the device-admin policies are declared
up front in `res/xml/device_admin_policies.xml` for that follow-up work).

## Architecture (first cut)

```
MdmAgentApp (Application)
  └─ AppContainer (manual DI)
       ├─ SecureDeviceStore        EncryptedSharedPreferences: deviceId + device JWT + baseUrl
       ├─ DeviceApi                Retrofit (real) or MockDeviceApi (BuildConfig.USE_MOCK)
       ├─ InventoryCollector       model/OS/serial/storage/battery/apps
       └─ DeviceRepository         enroll → heartbeat → inventory
  └─ WorkManager (MdmWorkerFactory)
       ├─ EnrollWorker             one-off, triggered by provisioning callback
       └─ HeartbeatWorker          periodic (15 min) + BootReceiver re-arm
device/
  ├─ MdmDeviceAdminReceiver        onProfileProvisioningComplete → reads admin extras → enqueues enroll
  └─ DeviceOwnerManager            isDeviceOwner / isAdminActive
ui/ AgentScreen + AgentViewModel   status + dev manual-enrollment fallback
```

### Deviations from the original plan (toolchain-forced)

The project is on a bleeding-edge toolchain (AGP 9.1.1 / Kotlin 2.2.10 with
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

## Build

```bash
cd apps/android-agent
./gradlew :app:assembleDebug      # APK at app/build/outputs/apk/debug/app-debug.apk
./gradlew :app:testDebugUnitTest  # wire-contract tests (MockWebServer)
```

`BuildConfig.USE_MOCK` defaults to **true** so the full enroll/heartbeat/
inventory flow runs without a backend. Set it to `false` (and point
`MDM_BASE_URL`, default `http://10.0.2.2:5573/`) once the server device
endpoints exist.

> Stable signing identity for QR provisioning lives in `keystore/mdm-dev.jks`
> (dev-only, committed on purpose so the signature checksum is constant).

## Wire contract (backend to implement later)

```
POST /api/v1/devices/enroll            { enrollmentToken, device:{model,manufacturer,osVersion,serial} }
                                       -> { deviceId, deviceToken }            # deviceToken = device JWT
POST /api/v1/devices/{id}/heartbeat    Bearer deviceToken | { battery, storageFreeBytes, online, ts } -> { ok }
POST /api/v1/devices/{id}/inventory    Bearer deviceToken | { os, model, manufacturer, serial, storage, apps[] } -> { ok }
```

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
    "enrollmentToken": "TOKEN_FROM_SERVER",
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
- On success, `MdmDeviceAdminReceiver.onProfileProvisioningComplete` reads
  `enrollmentToken` + `serverBaseUrl` from the extras and enqueues `EnrollWorker`.

## Provisioning B — ADB (dev, no factory reset of QR flow)

The device/emulator must have no accounts and no other device owner.

```bash
adb install app/build/outputs/apk/debug/app-debug.apk
adb shell dpm set-device-owner com.openmdm.agent/com.openmdm.agent.device.MdmDeviceAdminReceiver
adb shell dumpsys device_policy | grep -i "Device Owner"   # verify
```

ADB `set-device-owner` does **not** deliver provisioning extras, so enroll from
the app's **Manual enrollment (dev)** card: enter the token (+ optional base
URL) and tap *Enroll*. This arms the periodic heartbeat.

## Verify the flow

1. Launch the app → status card shows `Device Owner: yes` after Provisioning B.
2. Enroll (QR auto, or manual card) → `Enrolled: yes` and a `Device id` appear.
3. Tap **Heartbeat** / **Inventory** → with `USE_MOCK=true` they succeed
   immediately; with a real backend, watch the OkHttp logs / server.
```
