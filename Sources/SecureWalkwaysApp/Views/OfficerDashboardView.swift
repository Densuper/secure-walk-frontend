import SwiftUI

struct OfficerDashboardView: View {
    @EnvironmentObject private var appState: AppState
    @State private var selectedCheckpoint: Checkpoint?

    var body: some View {
        NavigationStack {
            VStack {
                List(selection: $selectedCheckpoint) {
                    Section("Assigned Checkpoints") {
                        ForEach(appState.checkpoints) { checkpoint in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(checkpoint.name)
                                        .font(.headline)
                                    Text(checkpoint.locationDescription)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Image(systemName: "qrcode.viewfinder")
                            }
                            .contentShape(Rectangle())
                            .onTapGesture { selectedCheckpoint = checkpoint }
                        }
                    }

                    Section("Recent Walks") {
                        ForEach(appState.walks) { walk in
                            WalkSummary(walk: walk)
                        }
                    }
                }

                if let selectedCheckpoint {
                    Button {
                        Task { await scan(checkpoint: selectedCheckpoint) }
                    } label: {
                        Text("Scan \(selectedCheckpoint.name)")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .padding()
                }
            }
            .navigationTitle("Officer Tools")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Refresh") {
                        Task { await appState.refreshOfficerData() }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Sign Out", role: .destructive) {
                        appState.logout()
                    }
                }
            }
        }
    }

    private func scan(checkpoint: Checkpoint) async {
        await appState.completeCheckpointScan(checkpoint)
    }
}

private struct WalkSummary: View {
    var walk: Walk

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(walk.status.rawValue.capitalized)
                .font(.headline)
            Text(walk.startedAt.formatted(date: .numeric, time: .shortened))
                .font(.caption)
        }
    }
}
