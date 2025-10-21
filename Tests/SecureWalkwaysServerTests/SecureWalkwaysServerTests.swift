import XCTVapor
@testable import SecureWalkwaysServer

final class SecureWalkwaysServerTests: XCTestCase {
    func testLoginEndpoint() throws {
        let app = Application(.testing)
        defer { app.shutdown() }
        try configure(app)

        let payload = LoginPayload(email: "admin@securewalk.app", password: "password")
        try app.test(.POST, "/api/login", beforeRequest: { req in
            try req.content.encode(payload)
        }, afterResponse: { res in
            XCTAssertEqual(res.status, .ok)
            let token = try res.content.decode(TokenResponse.self)
            XCTAssertEqual(token.email, "admin@securewalk.app")
            XCTAssertNotNil(token.token)
        })
    }
}
