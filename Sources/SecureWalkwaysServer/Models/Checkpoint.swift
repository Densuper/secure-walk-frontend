import Fluent
import Vapor

final class Checkpoint: Model, Content {
    static let schema = "checkpoints"

    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

    @Field(key: "locationDescription")
    var locationDescription: String

    @Field(key: "qrCode")
    var qrCode: String

    @Field(key: "isActive")
    var isActive: Bool

    @Siblings(through: UserCheckpoint.self, from: \.$checkpoint, to: \.$user)
    var assignedUsers: [User]

    init() {}

    init(id: UUID? = nil, name: String, locationDescription: String, qrCode: String, isActive: Bool) {
        self.id = id
        self.name = name
        self.locationDescription = locationDescription
        self.qrCode = qrCode
        self.isActive = isActive
    }
}

struct CheckpointDTO: Content {
    var id: UUID
    var name: String
    var locationDescription: String
    var qrCode: String
    var isActive: Bool

    init(model: Checkpoint) {
        id = model.id ?? UUID()
        name = model.name
        locationDescription = model.locationDescription
        qrCode = model.qrCode
        isActive = model.isActive
    }
}

final class UserCheckpoint: Model {
    static let schema = "user_checkpoint"

    @ID(key: .id)
    var id: UUID?

    @Parent(key: "user_id")
    var user: User

    @Parent(key: "checkpoint_id")
    var checkpoint: Checkpoint

    init() {}

    init(userID: UUID, checkpointID: UUID) {
        self.$user.id = userID
        self.$checkpoint.id = checkpointID
    }
}
