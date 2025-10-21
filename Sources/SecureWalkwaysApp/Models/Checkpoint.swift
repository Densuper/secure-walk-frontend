import Foundation

struct Checkpoint: Codable, Identifiable, Hashable {
    var id: UUID
    var name: String
    var locationDescription: String
    var qrCode: String
    var isActive: Bool
}

extension Checkpoint {
    static let sample = Checkpoint(
        id: UUID(),
        name: "Front Lobby",
        locationDescription: "Main building entrance",
        qrCode: "FRONT-LOBBY-001",
        isActive: true
    )
}
