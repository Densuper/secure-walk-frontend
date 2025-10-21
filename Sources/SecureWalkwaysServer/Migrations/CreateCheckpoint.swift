import Fluent

struct CreateCheckpoint: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("checkpoints")
            .id()
            .field("name", .string, .required)
            .field("locationDescription", .string, .required)
            .field("qrCode", .string, .required)
            .field("isActive", .bool, .required)
            .unique(on: "qrCode")
            .create()

        try await database.schema("user_checkpoint")
            .id()
            .field("user_id", .uuid, .required, .references("users", "id", onDelete: .cascade))
            .field("checkpoint_id", .uuid, .required, .references("checkpoints", "id", onDelete: .cascade))
            .unique(on: "user_id", "checkpoint_id")
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("user_checkpoint").delete()
        try await database.schema("checkpoints").delete()
    }
}
