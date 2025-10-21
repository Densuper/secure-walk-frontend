import Vapor
import Fluent
import FluentSQLiteDriver

public func configure(_ app: Application) throws {
    app.databases.use(.sqlite(.file("secure-walkways.sqlite")), as: .sqlite)
    app.migrations.add(CreateUser())
    app.migrations.add(CreateCheckpoint())
    app.migrations.add(CreateWalk())
    app.migrations.add(SeedDatabase())

    try app.autoMigrate().wait()

    try routes(app)
}

var env = try Environment.detect()
try LoggingSystem.bootstrap(from: &env)
let app = Application(env)
defer { app.shutdown() }
try configure(app)
try app.run()
