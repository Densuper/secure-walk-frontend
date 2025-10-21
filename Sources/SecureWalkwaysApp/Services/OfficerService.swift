import Foundation

final class OfficerService {
    private let client: APIClient

    init(baseURL: URL = URL(string: "http://127.0.0.1:8080")!, tokenProvider: @escaping () -> String? = { UserDefaults.standard.string(forKey: "secure.walkways.token") }) {
        self.client = APIClient(baseURL: baseURL, tokenProvider: tokenProvider)
    }

    func fetchAssignedCheckpoints() async throws -> [Checkpoint] {
        struct Request: APIRequest {
            typealias Response = [Checkpoint]
            var path: String { "/api/officer/checkpoints" }
        }
        return try await client.send(Request())
    }

    func fetchActiveWalks() async throws -> [Walk] {
        struct Request: APIRequest {
            typealias Response = [Walk]
            var path: String { "/api/officer/walks" }
        }
        return try await client.send(Request())
    }

    func recordScan(checkpoint: Checkpoint) async throws -> Walk {
        struct Request: APIRequest {
            typealias Response = Walk
            struct Body: Codable {
                var checkpointId: UUID
            }

            var path: String { "/api/officer/scan" }
            var method: HTTPMethod { .post }
            var body: Body?
        }

        return try await client.send(Request(body: .init(checkpointId: checkpoint.id)))
    }
}
