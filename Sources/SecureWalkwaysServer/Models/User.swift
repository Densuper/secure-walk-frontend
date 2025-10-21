import Vapor
import Fluent
import Crypto
import Foundation

final class User: Model, Content {
    static let schema = "users"

    enum Role: String, Codable, Content, CaseIterable {
        case admin
        case officer
    }

    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

    @Field(key: "email")
    var email: String

    @Field(key: "passwordHash")
    var passwordHash: String

    @Enum(key: "role")
    var role: Role

    @Children(for: \.$officer)
    var walks: [Walk]

    @Siblings(through: UserCheckpoint.self, from: \.$user, to: \.$checkpoint)
    var assignedCheckpoints: [Checkpoint]

    @Children(for: \.$user)
    var tokens: [UserToken]

    init() {}

    init(id: UUID? = nil, name: String, email: String, passwordHash: String, role: Role) {
        self.id = id
        self.name = name
        self.email = email
        self.passwordHash = passwordHash
        self.role = role
    }

    func verify(password: String) async throws -> Bool {
        try Bcrypt.verify(password, created: passwordHash)
    }

    func generateToken() throws -> UserToken {
        let bytes = (0..<32).map { _ in UInt8.random(in: 0...255) }
        let token = Data(bytes).base64EncodedString()
        return UserToken(value: token, userID: try requireID())
    }
}

final class UserToken: Model {
    static let schema = "tokens"

    @ID(key: .id)
    var id: UUID?

    @Field(key: "value")
    var value: String

    @Parent(key: "user_id")
    var user: User

    init() {}

    init(id: UUID? = nil, value: String, userID: UUID) {
        self.id = id
        self.value = value
        self.$user.id = userID
    }
}

struct UserTokenAuthenticator: AsyncBearerAuthenticator {
    func authenticate(bearer: BearerAuthorization, for request: Request) async throws {
        guard let token = try await UserToken.query(on: request.db).filter(\.$value == bearer.token).with(\.$user).first() else {
            return
        }
        request.auth.login(token.user)
    }
}
