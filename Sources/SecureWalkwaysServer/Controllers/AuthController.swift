import Vapor
import Fluent

struct LoginPayload: Content {
    var email: String
    var password: String
}

final class AuthController {
    func login(req: Request) async throws -> TokenResponse {
        let payload = try req.content.decode(LoginPayload.self)
        guard let user = try await User.query(on: req.db).filter(\.$email == payload.email).first() else {
            throw Abort(.unauthorized)
        }

        guard try await user.verify(password: payload.password) else {
            throw Abort(.unauthorized)
        }

        let token = try user.generateToken()
        try await token.save(on: req.db)
        return TokenResponse(user: user, token: token.value)
    }

    func me(req: Request) async throws -> TokenResponse {
        let user = try req.auth.require(User.self)
        guard let token = try await user.$tokens.get(on: req.db).first else {
            throw Abort(.unauthorized)
        }
        return TokenResponse(user: user, token: token.value)
    }
}

struct TokenResponse: Content {
    var id: UUID
    var name: String
    var email: String
    var role: User.Role
    var token: String?

    init(user: User, token: String? = nil) {
        id = user.id ?? UUID()
        name = user.name
        email = user.email
        role = user.role
        self.token = token
    }
}
