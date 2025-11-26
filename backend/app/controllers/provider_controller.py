import os, uuid, bcrypt, random, string, json, base64
from datetime import datetime
from werkzeug.utils import secure_filename

from app.models.provider_model import ProviderModel   
from app.utils.email_utils import (
    send_activation_email,
    send_otp_email,
    send_reset_otp_email,
    send_email
)
from app.utils.encrypt_utils import encrypt_value, decrypt_value
from app.utils.file_utils import save_uploaded_file
from app.config import Config


ADMIN_EMAIL = Config.EMAIL_CONFIG['sender_email']


class ProviderController:

    # ===================================================================
    #                       1) AUTHENTICATION
    # ===================================================================

    @staticmethod
    def signup(data):
        email = data['email']
        password = data['password']
        phone = data.get('phone_number')
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        token = str(uuid.uuid4())

        # NEW: insert into users_t + providers_t
        ProviderModel.insert_provider(email, hashed, phone, token)
        send_activation_email(email, token)

        return {"message": "Signup successful, check your email."}, 200

    @staticmethod
    def activate_account(token):
        user = ProviderModel.get_provider_by_token(token)

        if not user:
            return {"error": "Invalid activation token"}, 400

        ProviderModel.activate_account(token)

        return {"message": "Account activated successfully", "email": user['email_id']}, 200

    @staticmethod
    def login(email, password):
        provider = ProviderModel.get_provider_login(email)

        if not provider:
            return {"error": "User not found"}, 404

        # Check password
        if not bcrypt.checkpw(password.encode(), provider['password_hash'].encode()):
            return {"error": "Invalid credentials"}, 401

        if not provider['active_status']:
            return {"error": "Account not activated"}, 401

        # OTP flow remains the same
        otp = ''.join(random.choices(string.digits, k=6))
        ProviderModel.insert_otp(email, otp)
        send_otp_email(email, otp)

        return {"message": "OTP sent to email"}, 200

    @staticmethod
    def verify_otp(email, otp):
        record = ProviderModel.get_otp(email)

        if record and record['otp_code'] == otp:
            ProviderModel.delete_otp(email)
            return {"message": "OTP verified", "email": email}, 200

        return {"error": "Invalid or expired OTP"}, 401

    @staticmethod
    def resend_otp(email):
        ProviderModel.delete_otp(email)

        otp = ''.join(random.choices(string.digits, k=6))
        ProviderModel.insert_otp(email, otp)

        send_otp_email(email, otp)

        return {"message": "OTP resent successfully"}, 200

    @staticmethod
    def forgot_send_otp(email):
        user = ProviderModel.get_provider_login(email)

        if not user or not user["active_status"]:
            return {"error": "Account not found or not activated"}, 404

        otp = ''.join(random.choices(string.digits, k=6))
        ProviderModel.insert_otp(email, otp)
        send_reset_otp_email(email, otp)

        return {"message": "Reset OTP sent to email"}, 200

    @staticmethod
    def verify_reset_otp(email, otp):
        record = ProviderModel.get_otp(email)

        if record and record['otp_code'] == otp:
            ProviderModel.delete_otp(email)
            token = str(uuid.uuid4())
            ProviderModel.set_reset_token(email, token)

            return {"message": "OTP verified", "reset_token": token}, 200

        return {"error": "Invalid or expired OTP"}, 401

    @staticmethod
    def reset_password(email, reset_token, password):
        info = ProviderModel.get_reset_info(email)

        if not info:
            return {"error": "Account not found"}, 404

        if info['reset_token'] != reset_token or info['reset_expiry'] < datetime.now():
            return {"error": "Invalid or expired reset token"}, 400

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

        ProviderModel.update_password(email, hashed)
        return {"message": "Password reset successfully"}, 200

    # ===================================================================
    #                         2) BANK DETAILS
    # ===================================================================

    @staticmethod
    def update_bank(email, bank_name, holder_name, account_number, swift, bank_statement):
        provider_details = ProviderModel.get_provider(email)

        if not provider_details:
            return {"error": "Provider not found"}, 404

        provider_id = provider_details['provider_id']

        swift_enc = encrypt_value(swift)
        acc_enc = encrypt_value(account_number)

        existing = ProviderModel.get_bank(provider_id)

        if existing:
            ProviderModel.update_bank(provider_id, bank_name, swift_enc, acc_enc, holder_name, bank_statement)
        else:
            ProviderModel.insert_bank(provider_id, bank_name, swift_enc, acc_enc, holder_name, bank_statement)

        send_email(email, "Bank Details Updated", "Your bank details were successfully updated.")
        return {"message": "Bank details updated"}, 200

    # ===================================================================
    #                     3) PROFILE + SERVICES (UPDATED)
    # ===================================================================

    @staticmethod
    def get_profile(email):
        provider = ProviderModel.get_provider(email)

        if not provider:
            return {"error": "Provider not found"}, 404

        user_uid = provider['user_uid']

        # services now come from unified table
        services_rows = ProviderModel.get_services(user_uid)

        services = [
            {
                "service_name": s['service_name'],
                "service_rate": float(s['service_rate']) if s['service_rate'] else 0.0,
                "region": s.get('region', ''),
                "state": s.get('state', ''),
                "city": s.get('city', '')
            }
            for s in services_rows
        ]

        bank_details = None
        provider_id = provider["provider_id"]
        bank_row = ProviderModel.get_bank(provider_id)

        if bank_row:
            bank_details = {
                "bank_name": bank_row['bank_name'],
                "swift": decrypt_value(bank_row["swift_code"]),
                "bank_account_number": decrypt_value(bank_row["bank_account_number"]),
                "holder_name": decrypt_value(bank_row["account_holder_name"]),
                "bank_statement": base64.b64encode(bank_row["bank_statement"]).decode()
                if bank_row.get("bank_statement") else None
            }

        response = {
            **provider,
            "profile_pic": base64.b64encode(provider['profile_pic']).decode() if provider.get('profile_pic') else None,
            "authorized_certificate": base64.b64encode(provider['authorized_certificate']).decode()
            if provider.get('authorized_certificate') else None,
            "services": services,
            "bank_details": bank_details
        }

        return response, 200

    @staticmethod
    def update_profile(form, files):
        email = form.get("email")

        provider = ProviderModel.get_provider(email)
        if not provider:
            return {"error": "Provider not found"}, 404

        user_uid = provider["user_uid"]

        # handle files
        profile_file = files.get("profile_image")
        cert_file = files.get("certificate")

        # ---- SAVE TO DISK (missing before) ----
        profile_path = save_uploaded_file(profile_file, "provider_profile") if profile_file else None
        certificate_path = save_uploaded_file(cert_file, "provider_certificates") if cert_file else None

        if profile_file: profile_file.seek(0)
        if cert_file: cert_file.seek(0)

        profile_bytes = profile_file.read() if profile_file else provider["profile_pic"]
        cert_bytes = cert_file.read() if cert_file else provider["authorized_certificate"]

        updated_data = {
            "full_name": form.get("full_name"),
            "id_type": form.get("id_type"),
            "id_number": form.get("id_number"),
            "mailing_address": form.get("mailing_address"),
            "billing_address": form.get("billing_address"),
            "contact_number": form.get("contact_number"),
            "alternate_contact_number": form.get("alternate_contact_number"),
            "tin_number": form.get("tin_number"),
            "profile_pic": profile_bytes,
            "authorized_certificate": cert_bytes
        }

        ProviderModel.update_provider(email, updated_data)
        ProviderModel.update_status(email, "pending")

        # ----------- Replace services (now via user_uid) -------------
        ProviderModel.delete_services(user_uid)

        services_raw = form.get("services", "[]")
        try:
            services_list = json.loads(services_raw)
        except:
            services_list = []

        cleaned = []
        for item in services_list:
            cleaned.append((
                item.get("service_name") or item.get("service"),
                float(item.get("service_rate") or item.get("price") or 0),
                item.get("region", ""),
                item.get("state", ""),
                item.get("city", "")
            ))

        if cleaned:
            ProviderModel.insert_services(user_uid, cleaned)

        # notifications
        send_email(ADMIN_EMAIL, "New Provider Ready for Review", f"{email} submitted updated profile")
        send_email(email, "Profile Submitted", "Your profile is now under review")

        return {"message": "Profile submitted successfully", "status": "pending"}, 200
