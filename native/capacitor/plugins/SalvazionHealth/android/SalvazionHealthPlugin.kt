package org.salvazion.plugins.health

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

/**
 * SalvazionHealth — Health Connect reader for Android.
 * Requires Health Connect app + declared permissions in AndroidManifest.
 */
@CapacitorPlugin(name = "SalvazionHealth")
class SalvazionHealthPlugin : Plugin() {

    private val scope = CoroutineScope(Dispatchers.Main)

    private fun clientOrNull(): HealthConnectClient? {
        val status = HealthConnectClient.getSdkStatus(context)
        if (status != HealthConnectClient.SDK_AVAILABLE) return null
        return HealthConnectClient.getOrCreate(context)
    }

    private val permissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class)
    )

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val available = HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE
        val ret = JSObject()
        ret.put("platform", "android")
        ret.put("healthKit", false)
        ret.put("healthConnect", available)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestAuthorization(call: PluginCall) {
        val client = clientOrNull()
        if (client == null) {
            call.resolve(JSObject().put("authorized", false))
            return
        }
        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                // Permission contract is usually launched from an Activity contract;
                // if already granted, report true; otherwise host Activity should launch request.
                val ok = granted.containsAll(permissions)
                call.resolve(JSObject().put("authorized", ok || granted.isNotEmpty()))
            } catch (e: Exception) {
                call.resolve(JSObject().put("authorized", false))
            }
        }
    }

    @PluginMethod
    fun queryToday(call: PluginCall) {
        val client = clientOrNull()
        if (client == null) {
            call.resolve(JSObject())
            return
        }
        scope.launch {
            try {
                val zone = ZoneId.systemDefault()
                val start = LocalDate.now(zone).atStartOfDay(zone).toInstant()
                val end = Instant.now()
                val range = TimeRangeFilter.between(start, end)
                val ret = JSObject()

                // Steps
                val steps = client.readRecords(
                    ReadRecordsRequest(StepsRecord::class, timeRangeFilter = range)
                )
                var stepSum = 0L
                for (r in steps.records) stepSum += r.count
                if (stepSum > 0) ret.put("steps", stepSum.toDouble())

                // Distance
                val dist = client.readRecords(
                    ReadRecordsRequest(DistanceRecord::class, timeRangeFilter = range)
                )
                var meters = 0.0
                for (r in dist.records) meters += r.distance.inMeters
                if (meters > 0) ret.put("distanceMeters", meters)

                // Active calories
                val cal = client.readRecords(
                    ReadRecordsRequest(ActiveCaloriesBurnedRecord::class, timeRangeFilter = range)
                )
                var kcal = 0.0
                for (r in cal.records) kcal += r.energy.inKilocalories
                if (kcal > 0) ret.put("activeCalories", kcal)

                // Exercise sessions → active minutes
                val sessions = client.readRecords(
                    ReadRecordsRequest(ExerciseSessionRecord::class, timeRangeFilter = range)
                )
                var activeMin = 0.0
                for (r in sessions.records) {
                    activeMin += java.time.Duration.between(r.startTime, r.endTime).toMinutes().toDouble()
                }
                if (activeMin > 0) ret.put("activeMinutes", activeMin)

                // Resting HR (latest)
                val rhr = client.readRecords(
                    ReadRecordsRequest(RestingHeartRateRecord::class, timeRangeFilter = range)
                )
                rhr.records.lastOrNull()?.let { ret.put("restingHeartRate", it.beatsPerMinute.toDouble()) }

                // Sleep
                val sleep = client.readRecords(
                    ReadRecordsRequest(SleepSessionRecord::class, timeRangeFilter = range)
                )
                var sleepMin = 0.0
                var bed: Instant? = null
                var wake: Instant? = null
                for (r in sleep.records) {
                    sleepMin += java.time.Duration.between(r.startTime, r.endTime).toMinutes().toDouble()
                    if (bed == null || r.startTime.isBefore(bed)) bed = r.startTime
                    if (wake == null || r.endTime.isAfter(wake)) wake = r.endTime
                }
                if (sleepMin > 0) ret.put("sleepMinutes", sleepMin)
                val fmt = DateTimeFormatter.ofPattern("HH:mm").withZone(zone)
                bed?.let { ret.put("sleepBed", fmt.format(it)) }
                wake?.let { ret.put("sleepWake", fmt.format(it)) }

                // Weight latest
                val weight = client.readRecords(
                    ReadRecordsRequest(WeightRecord::class, timeRangeFilter = range)
                )
                weight.records.lastOrNull()?.let {
                    ret.put("weightKg", it.weight.inKilograms)
                }

                call.resolve(ret)
            } catch (e: Exception) {
                call.reject(e.message)
            }
        }
    }
}
