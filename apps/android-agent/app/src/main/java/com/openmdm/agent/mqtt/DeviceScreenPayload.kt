package com.openmdm.agent.mqtt

import kotlinx.serialization.Serializable

/**
 * Body published (retained) on `mdm/devices/{id}/screen`, reported whenever
 * the lock-screen state changes — independently of any command, e.g. the
 * user manually locking/unlocking the device (see [ScreenLockReporter]).
 * Mirrors `deviceScreenSchema` in
 * apps/api/src/features/command/dto/schema.ts.
 */
@Serializable
data class DeviceScreenPayload(val locked: Boolean)
