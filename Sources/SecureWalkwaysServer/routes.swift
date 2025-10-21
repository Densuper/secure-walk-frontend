import Vapor

func routes(_ app: Application) throws {
    let authController = AuthController()
    let adminController = AdminController()
    let officerController = OfficerController()

    let api = app.grouped("api")
    api.post("login", use: authController.login)

    let tokenProtected = api.grouped(UserTokenAuthenticator(), User.guardMiddleware())
    tokenProtected.get("me", use: authController.me)

    let adminProtected = tokenProtected.grouped(AdminMiddleware())
    adminProtected.get("checkpoints", use: adminController.listCheckpoints)
    adminProtected.post("checkpoints", use: adminController.createCheckpoint)
    adminProtected.get("walks", use: adminController.walkHistory)

    let officerProtected = tokenProtected.grouped(OfficerMiddleware())
    officerProtected.get("officer", "checkpoints", use: officerController.listAssignedCheckpoints)
    officerProtected.get("officer", "walks", use: officerController.activeWalks)
    officerProtected.post("officer", "scan", use: officerController.recordScan)
}
