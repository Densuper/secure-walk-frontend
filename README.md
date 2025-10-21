# Secure Walkways (Swift Edition)

This repository now contains a complete Swift rewrite of the Secure Walkways platform. The project is organized as a Swift Package that bundles:

- **SecureWalkwaysApp** – a SwiftUI client that replaces the browser-based dashboards for administrators and security officers.
- **SecureWalkwaysServer** – a Vapor-based REST API with SQLite persistence that mirrors the original Node/Express backend.

The two targets share the same data models and JSON contracts to make it easy to keep both components in sync.

## Requirements

- Xcode 15 or Swift 5.9 toolchain
- SQLite 3 (bundled with macOS)
- Swift Package Manager (SPM)

## Running the Server

```bash
swift run SecureWalkwaysServer
```

The server boots on `http://127.0.0.1:8080`, performs automatic SQLite migrations, and seeds initial accounts and checkpoints from `Seed/seed.sql`.

## Running the SwiftUI Client

Open the package in Xcode and select the `SecureWalkwaysApp` scheme. The app provides:

- **Admin Dashboard** – manage officers, checkpoints, and view walk history.
- **Officer Patrol View** – scan QR codes, start and end walks.
- **Authentication** – sign-in for both roles with JWT tokens stored in the keychain.

## Testing

Server tests live under `Tests/SecureWalkwaysServerTests`. You can run them with:

```bash
swift test
```

The suite uses an in-memory SQLite database and seeded fixtures to verify authentication, checkpoint CRUD, and walk lifecycle behavior.

## Repository Layout

```
Package.swift
Sources/
  SecureWalkwaysApp/
    Models/
    Services/
    ViewModels/
    Views/
    Resources/
  SecureWalkwaysServer/
    Controllers/
    Migrations/
    Models/
    Seed/
Tests/
  SecureWalkwaysServerTests/
    Fixtures/
```

Feel free to extend the SwiftUI client with additional features or adapt the Vapor backend for deployment environments of your choice.
