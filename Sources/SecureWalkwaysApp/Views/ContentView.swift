import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            switch appState.flow {
            case .loading:
                ProgressView("Loading…")
            case .unauthenticated:
                LoginView()
            case .admin:
                AdminDashboardView()
            case .officer:
                OfficerDashboardView()
            }
        }
    }
}
