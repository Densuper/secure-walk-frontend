import Foundation

struct Walk: Codable, Identifiable, Hashable {
    enum Status: String, Codable {
        case scheduled
        case inProgress
        case completed
    }

    var id: UUID
    var officerId: UUID
    var checkpointId: UUID
    var startedAt: Date
    var completedAt: Date?
    var status: Status
    var notes: String?
}

extension Walk {
    static let sample = Walk(
        id: UUID(),
        officerId: User.placeholderOfficer.id,
        checkpointId: Checkpoint.sample.id,
        startedAt: Date(),
        completedAt: nil,
        status: .inProgress,
        notes: nil
    )
}
