import Fluent
import Vapor

struct SeedDatabase: AsyncMigration {
    func prepare(on database: Database) async throws {
        let admin = User(name: "Alice Admin", email: "admin@securewalk.app", passwordHash: try Bcrypt.hash("password"), role: .admin)
        let officer = User(name: "Oscar Officer", email: "officer@securewalk.app", passwordHash: try Bcrypt.hash("password"), role: .officer)

        try await admin.save(on: database)
        try await officer.save(on: database)

        let lobby = Checkpoint(name: "Lobby", locationDescription: "Front entrance", qrCode: "LOBBY-QR", isActive: true)
        let loadingDock = Checkpoint(name: "Loading Dock", locationDescription: "Rear loading zone", qrCode: "DOCK-QR", isActive: true)
        try await lobby.save(on: database)
        try await loadingDock.save(on: database)

        if let officerID = officer.id, let lobbyID = lobby.id {
            try await UserCheckpoint(userID: officerID, checkpointID: lobbyID).save(on: database)
        }
        if let officerID = officer.id, let dockID = loadingDock.id {
            try await UserCheckpoint(userID: officerID, checkpointID: dockID).save(on: database)
        }
    }

    func revert(on database: Database) async throws {
        try await UserToken.query(on: database).delete()
        try await UserCheckpoint.query(on: database).delete()
        try await Walk.query(on: database).delete()
        try await Checkpoint.query(on: database).delete()
        try await User.query(on: database).delete()
    }
}
