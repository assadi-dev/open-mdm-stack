package com.openmdm.agent.mqtt

import kotlinx.serialization.Serializable

/**
 * Body published (retained) on `mdm/devices/{id}/screen`, reported whenever
 * the screen power state changes (see [ScreenStateReporter]).
 * Mirrors `deviceScreenSchema` in
 * apps/api/src/features/command/dto/schema.ts.
 */
@Serializable
data class DeviceScreenPayload(val on: Boolean)
