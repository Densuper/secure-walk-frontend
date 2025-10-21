import Vapor
import Fluent

struct ScanPayload: Content {
    var checkpointId: UUID
}

final class OfficerController {
    func listAssignedCheckpoints(req: Request) async throws -> [CheckpointDTO] {
        let user = try req.auth.require(User.self)
        let checkpoints = try await user.$assignedCheckpoints.query(on: req.db).all()
        return checkpoints.map { CheckpointDTO(model: $0) }
    }

    func activeWalks(req: Request) async throws -> [WalkDTO] {
        let user = try req.auth.require(User.self)
        let walks = try await user.$walks.query(on: req.db).with(\.$checkpoint).all()
        return walks.map { WalkDTO(model: $0) }
    }

    func recordScan(req: Request) async throws -> WalkDTO {
        let payload = try req.content.decode(ScanPayload.self)
        let user = try req.auth.require(User.self)
        guard let checkpoint = try await Checkpoint.find(payload.checkpointId, on: req.db) else {
            throw Abort(.notFound)
        }

        let walk = Walk(officerID: try user.requireID(), checkpointID: try checkpoint.requireID(), startedAt: Date(), completedAt: nil, status: .inProgress, notes: nil)
        try await walk.save(on: req.db)
        return WalkDTO(model: walk)
    }
}
