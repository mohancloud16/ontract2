# backend/app/__init__.py
from flask import Flask, send_from_directory
from flask_cors import CORS
from .models.database import db
from app.config import Config


def create_app(include_admin: bool = False):
    app = Flask(__name__)
    app.config.from_object(Config)

    # ---------------- CORS CONFIG ----------------
    # Make sure Config.ALLOWED_ORIGINS is like:
    # ALLOWED_ORIGINS = ["http://localhost:5173"]
    #
    # For DEV only, you can hardcode:
    # allowed_origins = ["http://localhost:5173"]
    #
    allowed_origins = getattr(Config, "ALLOWED_ORIGINS", ["http://localhost:5173"])

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    # ---------------- STATIC UPLOADS ----------------
    @app.route("/uploads/<path:filename>")
    def uploaded_files(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # ---------------- DB INIT ----------------
    db.init_app(app)

    # ==================== IMPORT BLUEPRINTS ====================
    from app.views.provider_routes import provider_bp
    from app.views.file_routes import file_bp
    from app.views.notification_routes import notification_bp
    from app.views.location_routes import location_bp
    from app.views.contractor_routes import contractor_bp

    from app.controllers.workorder_controller import workorder_bp
    from app.controllers.testdb_controller import testdb_bp
    from app.views.workorder_area_view import workorder_area_view
    from app.views.workorder_type_view import workorder_type_view
    from app.controllers.workorder_mapping_controller import workorder_mapping_bp
    from app.routes.workorder_mail_bp import workorder_mail_bp

    # ================= REGISTER BLUEPRINTS ======================

    # General provider / other routes
    app.register_blueprint(provider_bp, url_prefix="/api")
    app.register_blueprint(file_bp, url_prefix="/api")
    app.register_blueprint(notification_bp, url_prefix="/api")
    app.register_blueprint(location_bp, url_prefix="/api")

    # Contractor routes
    # Full path for signup: /api/contractor/contractor_signup
    app.register_blueprint(contractor_bp, url_prefix="/api/contractor")

    # Work order related
    app.register_blueprint(workorder_bp, url_prefix="/api/workorders")
    app.register_blueprint(testdb_bp, url_prefix="/api/testdb")
    app.register_blueprint(workorder_area_view, url_prefix="/api")
    app.register_blueprint(workorder_type_view, url_prefix="/api/workorder-type")
    app.register_blueprint(workorder_mapping_bp, url_prefix="/api/mapping")
    app.register_blueprint(workorder_mail_bp, url_prefix="/api/workorders")

    # Admin (optional)
    if include_admin:
        from app.views.admin_routes import admin_bp

        app.register_blueprint(admin_bp, url_prefix="/api/admin")

    return app
