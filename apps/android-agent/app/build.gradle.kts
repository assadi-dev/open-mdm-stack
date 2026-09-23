plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.openmdm.agent"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.openmdm.agent"
        minSdk = 29
        targetSdk = 38
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Default MDM server base URL. 10.0.2.2 is the host loopback from the
        // Android emulator; the API listens on 5573. Override per build type.
        buildConfigField("String", "MDM_SERVER_URL", "\"http://10.192.2.120:5573/\"")
        // When true, the network layer is backed by a local stub instead of the
        // (not-yet-implemented) real backend. See di/NetworkModule.
        buildConfigField("boolean", "USE_MOCK", "false")
        buildConfigField("String", "ENVIRONMENT", "\"dev\"")
    }

    // Stable signing identity shared across the team so the QR-provisioning
    // PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM stays constant for the MVP.
    signingConfigs {
        create("mdmDev") {
            storeFile = rootProject.file("keystore/mdm-dev.jks")
            storePassword = "mdmdevpass"
            keyAlias = "mdmdev"
            keyPassword = "mdmdevpass"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("mdmDev")
        }
        // Same as debug (debuggable, mdmDev-signed) but additionally marked
        // android:testOnly="true" (see src/buildTestOnly/AndroidManifest.xml)
        // so a provisioned Device Owner can be removed with
        // `adb shell dpm remove-active-admin` — impossible for a non-test
        // owner. Kept separate from plain `debug` so a regular debug build
        // stays install-only-via-testOnly-free, matching what QR/NFC
        // provisioning would need if debug were ever used for that (it isn't
        // — see PROVISIONING.md).
        create("buildTestOnly") {
            initWith(getByName("debug"))
            isDebuggable = true
            isJniDebuggable = true
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("mdmDev")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }

    // The HiveMQ MQTT client pulls in Netty, whose jars each ship the same
    // META-INF housekeeping files (versions.properties, INDEX.LIST, license
    // headers) — harmless duplicates for packaging, so they're dropped
    // instead of merged.
    packaging {
        resources {
            excludes += setOf(
                "META-INF/INDEX.LIST",
                "META-INF/io.netty.versions.properties",
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE*",
                "META-INF/NOTICE*",
            )
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Background work
    implementation(libs.androidx.work.runtime.ktx)

    // Secure storage
    implementation(libs.androidx.security.crypto)

    // QR scanning (optional enrollment channel)
    implementation(libs.zxing.android.embedded)

    // MQTT (remote commands + presence)
    implementation(libs.hivemq.mqtt.client)

    // Networking
    implementation(libs.retrofit)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging.interceptor)
    implementation(libs.retrofit.kotlinx.serialization.converter)
    implementation(libs.kotlinx.serialization.json)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.mockwebserver)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}