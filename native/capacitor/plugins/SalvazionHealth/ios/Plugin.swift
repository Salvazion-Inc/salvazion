import Foundation
import Capacitor
import HealthKit

/**
 * SalvazionHealth — HealthKit reader for iOS.
 * Register as Capacitor plugin "SalvazionHealth".
 */
@objc(SalvazionHealthPlugin)
public class SalvazionHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SalvazionHealthPlugin"
    public let jsName = "SalvazionHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "queryToday", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()

    private var readTypes: Set<HKObjectType> {
        var set = Set<HKObjectType>()
        let ids: [HKQuantityTypeIdentifier] = [
            .stepCount,
            .distanceWalkingRunning,
            .activeEnergyBurned,
            .heartRate,
            .restingHeartRate,
            .heartRateVariabilitySDNN,
            .oxygenSaturation,
            .bodyMass,
            .appleExerciseTime
        ]
        for id in ids {
            if let t = HKObjectType.quantityType(forIdentifier: id) {
                set.insert(t)
            }
        }
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            set.insert(sleep)
        }
        return set
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "platform": "ios",
            "healthKit": HKHealthStore.isHealthDataAvailable(),
            "healthConnect": false
        ])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["authorized": false])
            return
        }
        store.requestAuthorization(toShare: nil, read: readTypes) { success, _ in
            call.resolve(["authorized": success])
        }
    }

    @objc func queryToday(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve([:])
            return
        }

        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date())
        let end = Date()
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: .strictStartDate)

        var result: [String: Any] = [:]
        let group = DispatchGroup()

        func sumQuantity(_ id: HKQuantityTypeIdentifier, unit: HKUnit, key: String) {
            guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return }
            group.enter()
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .cumulativeSum) { _, stats, _ in
                if let sum = stats?.sumQuantity() {
                    result[key] = sum.doubleValue(for: unit)
                }
                group.leave()
            }
            self.store.execute(q)
        }

        func avgQuantity(_ id: HKQuantityTypeIdentifier, unit: HKUnit, key: String) {
            guard let type = HKQuantityType.quantityType(forIdentifier: id) else { return }
            group.enter()
            let q = HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: .discreteAverage) { _, stats, _ in
                if let avg = stats?.averageQuantity() {
                    result[key] = avg.doubleValue(for: unit)
                }
                group.leave()
            }
            self.store.execute(q)
        }

        sumQuantity(.stepCount, unit: HKUnit.count(), key: "steps")
        sumQuantity(.distanceWalkingRunning, unit: HKUnit.meter(), key: "distanceMeters")
        sumQuantity(.activeEnergyBurned, unit: HKUnit.kilocalorie(), key: "activeCalories")
        if #available(iOS 13.0, *) {
            sumQuantity(.appleExerciseTime, unit: HKUnit.minute(), key: "activeMinutes")
        }
        avgQuantity(.heartRate, unit: HKUnit.count().unitDivided(by: .minute()), key: "heartRateAvg")
        avgQuantity(.restingHeartRate, unit: HKUnit.count().unitDivided(by: .minute()), key: "restingHeartRate")
        avgQuantity(.heartRateVariabilitySDNN, unit: HKUnit.secondUnit(with: .milli), key: "hrv")
        avgQuantity(.oxygenSaturation, unit: HKUnit.percent(), key: "spo2")
        avgQuantity(.bodyMass, unit: HKUnit.gramUnit(with: .kilo), key: "weightKg")

        // Sleep (in bed / asleep)
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            group.enter()
            let q = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                var total: TimeInterval = 0
                var bed: Date?
                var wake: Date?
                for s in samples as? [HKCategorySample] ?? [] {
                    // Asleep values vary by iOS version; count any non-inBed awake carefully
                    total += s.endDate.timeIntervalSince(s.startDate)
                    if bed == nil || s.startDate < bed! { bed = s.startDate }
                    if wake == nil || s.endDate > wake! { wake = s.endDate }
                }
                if total > 0 {
                    result["sleepMinutes"] = total / 60.0
                }
                let fmt = DateFormatter()
                fmt.dateFormat = "HH:mm"
                if let bed = bed { result["sleepBed"] = fmt.string(from: bed) }
                if let wake = wake { result["sleepWake"] = fmt.string(from: wake) }
                group.leave()
            }
            self.store.execute(q)
        }

        group.notify(queue: .main) {
            // Normalize spo2 if returned 0–1
            if let spo2 = result["spo2"] as? Double, spo2 <= 1.0 {
                result["spo2"] = spo2 * 100.0
            }
            call.resolve(result)
        }
    }
}
