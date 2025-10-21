import Fluent

struct CreateWalk: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("walks")
            .id()
            .field("officer_id", .uuid, .required, .references("users", "id", onDelete: .cascade))
            .field("checkpoint_id", .uuid, .required, .references("checkpoints", "id", onDelete: .cascade))
            .field("startedAt", .datetime, .required)
            .field("completedAt", .datetime)
            .field("status", .string, .required)
            .field("notes", .string)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("walks").delete()
    }
}
