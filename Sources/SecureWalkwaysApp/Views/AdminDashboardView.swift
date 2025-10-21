import SwiftUI

struct AdminDashboardView: View {
    @EnvironmentObject private var appState: AppState
    @State private var isPresentingNewCheckpoint = false

    var body: some View {
        NavigationStack {
            List {
                Section("Checkpoints") {
                    ForEach(appState.checkpoints) { checkpoint in
                        VStack(alignment: .leading) {
                            Text(checkpoint.name)
                                .font(.headline)
                            Text(checkpoint.locationDescription)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                Section("Walk History") {
                    ForEach(appState.walks) { walk in
                        WalkRow(walk: walk)
                    }
                }
            }
            .navigationTitle("Admin Dashboard")
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button("Refresh") {
                        Task { await appState.refreshAdminData() }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button("New Checkpoint") { isPresentingNewCheckpoint = true }
                        Button("Sign Out", role: .destructive) { appState.logout() }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $isPresentingNewCheckpoint) {
                NewCheckpointView { draft in
                    Task {
                        await createCheckpoint(draft)
                    }
                }
                .presentationDetents([.medium])
            }
        }
    }

    private func createCheckpoint(_ draft: CheckpointDraft) async {
        do {
            let checkpoint = try await AdminService().createCheckpoint(draft)
            appState.checkpoints.append(checkpoint)
        } catch {
            // TODO: show error toast
        }
    }
}

private struct WalkRow: View {
    var walk: Walk

    private var statusText: String {
        switch walk.status {
        case .scheduled: return "Scheduled"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(statusText)
                .font(.headline)
            Text("Started: \(walk.startedAt.formatted(date: .numeric, time: .shortened))")
                .font(.caption)
            if let completed = walk.completedAt {
                Text("Completed: \(completed.formatted(date: .numeric, time: .shortened))")
                    .font(.caption)
            }
        }
    }
}
