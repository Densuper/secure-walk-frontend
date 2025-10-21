import Foundation

final class AdminService {
    private let client: APIClient

    init(baseURL: URL = URL(string: "http://127.0.0.1:8080")!, tokenProvider: @escaping () -> String? = { UserDefaults.standard.string(forKey: "secure.walkways.token") }) {
        self.client = APIClient(baseURL: baseURL, tokenProvider: tokenProvider)
    }

    func fetchCheckpoints() async throws -> [Checkpoint] {
        struct Request: APIRequest {
            typealias Response = [Checkpoint]
            var path: String { "/api/checkpoints" }
        }
        return try await client.send(Request())
    }

    func createCheckpoint(_ checkpoint: CheckpointDraft) async throws -> Checkpoint {
        struct Request: APIRequest {
            typealias Response = Checkpoint
            struct Body: Codable {
                var name: String
                var locationDescription: String
            }

            var path: String { "/api/checkpoints" }
            var method: HTTPMethod { .post }
            var body: Body?
        }

        return try await client.send(Request(body: .init(name: checkpoint.name, locationDescription: checkpoint.locationDescription)))
    }

    func fetchWalkHistory() async throws -> [Walk] {
        struct Request: APIRequest {
            typealias Response = [Walk]
            var path: String { "/api/walks" }
        }
        return try await client.send(Request())
    }
}

struct CheckpointDraft {
    var name: String
    var locationDescription: String
}
