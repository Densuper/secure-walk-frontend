import Fluent
import Vapor

final class Walk: Model, Content {
    static let schema = "walks"

    enum Status: String, Codable, Content {
        case scheduled
        case inProgress
        case completed
    }

    @ID(key: .id)
    var id: UUID?

    @Parent(key: "officer_id")
    var officer: User

    @Parent(key: "checkpoint_id")
    var checkpoint: Checkpoint

    @Field(key: "startedAt")
    var startedAt: Date

    @OptionalField(key: "completedAt")
    var completedAt: Date?

    @Enum(key: "status")
    var status: Status

    @OptionalField(key: "notes")
    var notes: String?

    init() {}

    init(id: UUID? = nil, officerID: UUID, checkpointID: UUID, startedAt: Date, completedAt: Date?, status: Status, notes: String?) {
        self.id = id
        self.$officer.id = officerID
        self.$checkpoint.id = checkpointID
        self.startedAt = startedAt
        self.completedAt = completedAt
        self.status = status
        self.notes = notes
    }
}

struct WalkDTO: Content {
    var id: UUID
    var officerId: UUID
    var checkpointId: UUID
    var startedAt: Date
    var completedAt: Date?
    var status: Walk.Status
    var notes: String?

    init(model: Walk) {
        id = model.id ?? UUID()
        officerId = model.$officer.id
        checkpointId = model.$checkpoint.id
        startedAt = model.startedAt
        completedAt = model.completedAt
        status = model.status
        notes = model.notes
    }
}
