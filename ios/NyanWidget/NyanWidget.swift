// にゃん日和 home-screen widget: your cat's face and needs, projected forward while the app is closed.
// Add to Xcode as a Widget Extension target named "NyanWidget" (see docs/WIDGETS.md).
import WidgetKit
import SwiftUI

private let appGroup = "group.com.lucidbruhhh.nyanbiyori"
private let needKeys = ["hunger", "fun", "clean", "energy"]

struct CatData: Codable {
    let name: String
    let level: Int
    let asleep: Bool
    let at: Double
    let needs: [String: Double]
    let rates: [String: Double]
    let vitality: Int
    let weight: String
}

struct CatEntry: TimelineEntry {
    let date: Date
    let cat: CatData?
    let needs: [String: Double]
    var mood: Double { needs.isEmpty ? 80 : needKeys.reduce(0) { $0 + (needs[$1] ?? 0) } / 4 }
}

private func loadCat() -> CatData? {
    guard let s = UserDefaults(suiteName: appGroup)?.string(forKey: "cat"), let d = s.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(CatData.self, from: d)
}

// Mirrors the game's offline rules: needs fall at their hourly rate but never below 20 while you're away.
private func project(_ c: CatData, to date: Date) -> [String: Double] {
    let hrs = min(10, max(0, (date.timeIntervalSince1970 * 1000 - c.at) / 3_600_000))
    var out: [String: Double] = [:]
    for k in needKeys {
        let v = c.needs[k] ?? 0, r = c.rates[k] ?? 0
        out[k] = (k == "energy" && c.asleep) ? min(100, v + hrs * 30) : max(min(v, 20), v - r * hrs)
    }
    return out
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> CatEntry {
        CatEntry(date: Date(), cat: nil, needs: ["hunger": 80, "fun": 75, "clean": 90, "energy": 70])
    }
    func getSnapshot(in context: Context, completion: @escaping (CatEntry) -> Void) {
        let cat = loadCat()
        completion(CatEntry(date: Date(), cat: cat, needs: cat.map { project($0, to: Date()) } ?? placeholder(in: context).needs))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<CatEntry>) -> Void) {
        let cat = loadCat()
        let entries = (0..<12).map { i -> CatEntry in
            let d = Date().addingTimeInterval(Double(i) * 1800)
            return CatEntry(date: d, cat: cat, needs: cat.map { project($0, to: d) } ?? [:])
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

private func portrait(for mood: Double) -> UIImage? {
    let face = mood >= 60 ? "happy" : mood >= 35 ? "okay" : "sad"
    guard let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else { return nil }
    return UIImage(contentsOfFile: dir.appendingPathComponent("widget_\(face).png").path)
}

private let pink = Color(red: 1.0, green: 0.44, blue: 0.62)
private let ink = Color(red: 0.36, green: 0.23, blue: 0.29)

struct NeedBar: View {
    let label: String
    let value: Double
    var body: some View {
        HStack(spacing: 6) {
            Text(label).font(.system(size: 11, weight: .bold, design: .rounded)).foregroundColor(ink).frame(width: 46, alignment: .leading)
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.7))
                    Capsule().fill(value < 25 ? Color.red.opacity(0.75) : pink).frame(width: max(6, g.size.width * value / 100))
                }
            }.frame(height: 8)
        }
    }
}

struct NyanWidgetView: View {
    @Environment(\.widgetFamily) var family
    let entry: CatEntry
    var moodText: String { entry.mood >= 60 ? "Happy and cozy ♡" : entry.mood >= 35 ? "Could use some attention" : "Misses you…" }

    var face: some View {
        Group {
            if let img = portrait(for: entry.mood) { Image(uiImage: img).resizable().scaledToFit() }
            else { Text("🐱").font(.system(size: 48)) }
        }
    }

    var body: some View {
        Group {
            if family == .systemSmall {
                VStack(spacing: 2) {
                    face.frame(height: 92)
                    Text(entry.cat?.name ?? "Nyan Biyori").font(.system(size: 14, weight: .heavy, design: .rounded)).foregroundColor(ink)
                    Text(moodText).font(.system(size: 10, weight: .semibold, design: .rounded)).foregroundColor(pink).lineLimit(1).minimumScaleFactor(0.7)
                }
            } else {
                HStack(spacing: 12) {
                    face.frame(width: 110, height: 110)
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(entry.cat?.name ?? "Nyan Biyori").font(.system(size: 16, weight: .heavy, design: .rounded)).foregroundColor(ink)
                            Spacer()
                            if let c = entry.cat { Text("Lv \(c.level)").font(.system(size: 11, weight: .bold, design: .rounded)).foregroundColor(pink) }
                        }
                        NeedBar(label: "おなか", value: entry.needs["hunger"] ?? 0)
                        NeedBar(label: "ごきげん", value: entry.needs["fun"] ?? 0)
                        NeedBar(label: "きれい", value: entry.needs["clean"] ?? 0)
                        NeedBar(label: "げんき", value: entry.needs["energy"] ?? 0)
                        Text(moodText).font(.system(size: 10, weight: .semibold, design: .rounded)).foregroundColor(pink)
                    }
                }
            }
        }
        .widgetURL(URL(string: "nyanbiyori://home"))
        .modifier(WidgetBackground())
    }
}

struct WidgetBackground: ViewModifier {
    let gradient = LinearGradient(colors: [Color(red: 1.0, green: 0.95, blue: 0.97), Color(red: 1.0, green: 0.86, blue: 0.91)], startPoint: .top, endPoint: .bottom)
    func body(content: Content) -> some View {
        if #available(iOS 17.0, *) { content.containerBackground(for: .widget) { gradient } }
        else { content.padding().background(gradient) }
    }
}

@main
struct NyanWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "NyanWidget", provider: Provider()) { entry in NyanWidgetView(entry: entry) }
            .configurationDisplayName("Nyan Biyori")
            .description("See how your cat is feeling at a glance.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}
