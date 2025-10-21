import Foundation
import Combine

@MainActor
final class AppState: ObservableObject {
    enum Flow {
        case loading
        case unauthenticated
        case admin
        case officer
    }

    @Published var flow: Flow = .loading
    @Published var currentUser: User? = nil
    @Published var checkpoints: [Checkpoint] = []
    @Published var walks: [Walk] = []

    private let authService: AuthenticationService
    private let adminService: AdminService
    private let officerService: OfficerService

    init(
        authService: AuthenticationService = AuthenticationService(),
        adminService: AdminService = AdminService(),
        officerService: OfficerService = OfficerService()
    ) {
        self.authService = authService
        self.adminService = adminService
        self.officerService = officerService
        Task {
            await bootstrap()
        }
    }

    func bootstrap() async {
        if let token = authService.cachedToken, let user = try? await authService.restoreSession(with: token) {
            currentUser = user
            await loadData(for: user)
        } else {
            flow = .unauthenticated
        }
    }

    func login(email: String, password: String) async throws {
        flow = .loading
        do {
            let user = try await authService.login(email: email, password: password)
            currentUser = user
            await loadData(for: user)
        } catch {
            flow = .unauthenticated
            throw error
        }
    }

    func logout() {
        authService.logout()
        currentUser = nil
        checkpoints = []
        walks = []
        flow = .unauthenticated
    }

    func loadData(for user: User) async {
        switch user.role {
        case .admin:
            flow = .admin
            await refreshAdminData()
        case .officer:
            flow = .officer
            await refreshOfficerData()
        }
    }

    func refreshAdminData() async {
        do {
            checkpoints = try await adminService.fetchCheckpoints()
            walks = try await adminService.fetchWalkHistory()
        } catch {
            // keep existing data, maybe show toast in future
        }
    }

    func refreshOfficerData() async {
        do {
            checkpoints = try await officerService.fetchAssignedCheckpoints()
            walks = try await officerService.fetchActiveWalks()
        } catch {
            // ignore errors for now
        }
    }

    func completeCheckpointScan(_ checkpoint: Checkpoint) async {
        do {
            let walk = try await officerService.recordScan(checkpoint: checkpoint)
            walks.append(walk)
        } catch {
            // TODO: error surface
        }
    }
}
