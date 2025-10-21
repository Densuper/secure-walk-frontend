// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SecureWalkways",
    platforms: [
        .macOS(.v13),
        .iOS(.v16)
    ],
    products: [
        .executable(name: "SecureWalkwaysServer", targets: ["SecureWalkwaysServer"]),
        .library(name: "SecureWalkwaysApp", targets: ["SecureWalkwaysApp"])
    ],
    dependencies: [
        .package(url: "https://github.com/vapor/vapor.git", from: "4.87.0"),
        .package(url: "https://github.com/vapor/fluent.git", from: "4.9.0"),
        .package(url: "https://github.com/vapor/fluent-sqlite-driver.git", from: "4.1.0")
    ],
    targets: [
        .target(
            name: "SecureWalkwaysApp",
            dependencies: [],
            resources: [
                .process("Resources/Seed.json")
            ]
        ),
        .executableTarget(
            name: "SecureWalkwaysServer",
            dependencies: [
                .product(name: "Vapor", package: "vapor"),
                .product(name: "Fluent", package: "fluent"),
                .product(name: "FluentSQLiteDriver", package: "fluent-sqlite-driver")
            ],
            resources: [
                .copy("Seed/seed.sql")
            ]
        ),
        .testTarget(
            name: "SecureWalkwaysServerTests",
            dependencies: ["SecureWalkwaysServer"],
            resources: [
                .copy("Fixtures/test-seed.sql")
            ]
        )
    ]
)
