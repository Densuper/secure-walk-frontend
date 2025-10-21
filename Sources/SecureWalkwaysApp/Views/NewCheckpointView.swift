import SwiftUI

struct NewCheckpointView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name: String = ""
    @State private var description: String = ""

    var onCreate: (CheckpointDraft) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Name", text: $name)
                    TextField("Location Description", text: $description)
                }
            }
            .navigationTitle("New Checkpoint")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        onCreate(.init(name: name, locationDescription: description))
                        dismiss()
                    }
                    .disabled(name.isEmpty || description.isEmpty)
                }
            }
        }
    }
}
