import Foundation

final class AuthenticationService {
    private let tokenKey = "secure.walkways.token"
    private let defaults: UserDefaults
    private let baseURL: URL

    init(baseURL: URL = URL(string: "http://127.0.0.1:8080")!, defaults: UserDefaults = .standard) {
        self.baseURL = baseURL
        self.defaults = defaults
    }

    var cachedToken: String? {
        defaults.string(forKey: tokenKey)
    }

    func login(email: String, password: String) async throws -> User {
        struct LoginRequest: APIRequest {
            typealias Response = User
            struct LoginBody: Codable {
                var email: String
                var password: String
            }

            var path: String { "/api/login" }
            var method: HTTPMethod { .post }
            var body: LoginBody?
        }

        let client = APIClient(baseURL: baseURL) { nil }
        let response = try await client.send(LoginRequest(body: .init(email: email, password: password)))
        if let token = response.token {
            defaults.set(token, forKey: tokenKey)
        }
        return response
    }

    func restoreSession(with token: String) async throws -> User {
        struct MeRequest: APIRequest {
            typealias Response = User
            var path: String { "/api/me" }
        }

        let client = APIClient(baseURL: baseURL) { token }
        return try await client.send(MeRequest())
    }

    func logout() {
        defaults.removeObject(forKey: tokenKey)
    }
}
