# backend/app/views/contractor_routes.py
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.controllers.contractor_controller import ContractorController

contractor_bp = Blueprint("contractor_bp", __name__)


# ---------------- SIGNUP ----------------
@contractor_bp.route("/contractor_signup", methods=["POST"])
@cross_origin()  # uses global CORS config from __init__.py
def signup():
    # Safely parse JSON body
    data = request.get_json(silent=True) or {}
    print("[contractor_signup] RAW DATA:", data)

    # Ensure service_type is set if you use it downstream
    data["service_type"] = 1

    result, status = ContractorController.signup(data)
    print("[contractor_signup] RESULT:", result, "STATUS:", status)

    return jsonify(result), status


# ---------------- ACTIVATE ----------------
@contractor_bp.route("/contractor_activate", methods=["POST"])
@cross_origin()
def activate():
    print("[contractor_activate] step1")
    payload = request.get_json(silent=True) or {}
    token = payload.get("token")
    result, status = ContractorController.activate(token)
    return jsonify(result), status


# ---------------- LOGIN ----------------
@contractor_bp.route("/login", methods=["POST"])
@cross_origin()
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    result, status = ContractorController.login(email, password)
    return jsonify(result), status


# ---------------- VERIFY OTP ----------------
@contractor_bp.route("/verify_otp", methods=["POST"])
@cross_origin()
def verify_otp():
    data = request.get_json(silent=True) or {}
    result, status = ContractorController.verify_otp(data)
    return jsonify(result), status


# ---------------- RESEND OTP ----------------
@contractor_bp.route("/resend_otp", methods=["POST"])
@cross_origin()
def resend_otp():
    data = request.get_json(silent=True) or {}
    result, status = ContractorController.resend_otp(data)
    return jsonify(result), status


# ---------------- COMPANY PROFILE (GET) ----------------
@contractor_bp.route("/company_profile", methods=["POST"])
@cross_origin()
def profile():
    data = request.get_json(silent=True) or {}
    result, status = ContractorController.get_profile(data)
    return jsonify(result), status


# ---------------- UPDATE COMPANY PROFILE ----------------
@contractor_bp.route("/update_company_profile", methods=["POST"])
@cross_origin()
def update_company_profile():
    result, status = ContractorController.update_company_profile(
        request.form, request.files
    )
    return jsonify(result), status


# ---------------- UPDATE COMPANY BANK ----------------
@contractor_bp.route("/update_company_bank", methods=["POST"])
@cross_origin()
def update_company_bank():
    result, status = ContractorController.update_company_bank(
        request.form, request.files
    )
    return jsonify(result), status


# ---------------- NOTIFICATIONS ----------------
@contractor_bp.route("/contractor_notifications", methods=["GET"])
@cross_origin()
def get_notifications():
    email = request.args.get("email")
    result, status = ContractorController.get_notifications(email)
    return jsonify(result), status


@contractor_bp.route("/contractor_unread_count", methods=["GET"])
@cross_origin()
def unread_count():
    email = request.args.get("email")
    result, status = ContractorController.unread_count(email)
    return jsonify(result), status


@contractor_bp.route("/contractor_mark_read", methods=["POST"])
@cross_origin()
def mark_read():
    data = request.get_json(silent=True) or {}
    result, status = ContractorController.mark_as_read(data)
    return jsonify(result), status
