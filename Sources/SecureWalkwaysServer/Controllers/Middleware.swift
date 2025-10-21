import Vapor

struct AdminMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        let user = try request.auth.require(User.self)
        guard user.role == .admin else {
            throw Abort(.forbidden)
        }
        return try await next.respond(to: request)
    }
}

struct OfficerMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        let user = try request.auth.require(User.self)
        guard user.role == .officer else {
            throw Abort(.forbidden)
        }
        return try await next.respond(to: request)
    }
}
