import Vapor
import Fluent

struct CheckpointInput: Content {
    var name: String
    var locationDescription: String
}

final class AdminController {
    func listCheckpoints(req: Request) async throws -> [CheckpointDTO] {
        try await Checkpoint.query(on: req.db).all().map { CheckpointDTO(model: $0) }
    }

    func createCheckpoint(req: Request) async throws -> CheckpointDTO {
        let input = try req.content.decode(CheckpointInput.self)
        let checkpoint = Checkpoint(name: input.name, locationDescription: input.locationDescription, qrCode: UUID().uuidString, isActive: true)
        try await checkpoint.save(on: req.db)
        return CheckpointDTO(model: checkpoint)
    }

    func walkHistory(req: Request) async throws -> [WalkDTO] {
        let walks = try await Walk.query(on: req.db).with(\.$checkpoint).with(\.$officer).all()
        return walks.map { WalkDTO(model: $0) }
    }
}
