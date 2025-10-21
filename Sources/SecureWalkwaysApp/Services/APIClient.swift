import Foundation

struct APIClient {
    enum APIError: Error {
        case invalidURL
        case decodingFailed
        case serverError(Int)
    }

    var baseURL: URL
    var tokenProvider: () -> String?

    init(baseURL: URL = URL(string: "http://127.0.0.1:8080")!, tokenProvider: @escaping () -> String? = { nil }) {
        self.baseURL = baseURL
        self.tokenProvider = tokenProvider
    }

    func send<Request: APIRequest>(_ request: Request) async throws -> Request.Response {
        var urlRequest = URLRequest(url: baseURL.appending(path: request.path))
        urlRequest.httpMethod = request.method.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = tokenProvider() {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = request.body {
            urlRequest.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await URLSession.shared.data(for: urlRequest)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidURL
        }

        guard 200..<300 ~= http.statusCode else {
            throw APIError.serverError(http.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(Request.Response.self, from: data)
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

protocol APIRequest {
    associatedtype Response: Decodable
    associatedtype Body: Encodable

    var path: String { get }
    var method: HTTPMethod { get }
    var body: Body? { get }
}

extension APIRequest {
    var method: HTTPMethod { .get }
    var body: Body? { nil }
}
