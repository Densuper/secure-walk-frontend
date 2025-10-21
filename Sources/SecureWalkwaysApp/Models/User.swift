import Foundation

struct User: Codable, Identifiable, Hashable {
    enum Role: String, Codable {
        case admin
        case officer
    }

    var id: UUID
    var name: String
    var email: String
    var role: Role
    var token: String?
}

extension User {
    static let placeholderAdmin = User(id: UUID(), name: "Admin", email: "admin@example.com", role: .admin, token: nil)
    static let placeholderOfficer = User(id: UUID(), name: "Officer", email: "officer@example.com", role: .officer, token: nil)
}
