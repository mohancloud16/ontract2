# app/controllers/admin_controller.py
import os, bcrypt, random, string
import tempfile
from flask import current_app
from app.models.admin_model import AdminModel
from app.utils.email_utils import send_email, send_admin_otp_email
from app.utils.pdf_utils import generate_certificate_pdf

class AdminController:

    # ===== Auth =====
    @staticmethod
    def login(email, password):
        if not email or not password:
            return {"error": "Email and password required"}, 400

        admin = AdminModel.get_admin_by_email(email)
        if not admin or not bcrypt.checkpw(password.encode(), admin['password_hash'].encode()):
            return {"error": "Invalid credentials"}, 401

        otp = ''.join(random.choices(string.digits, k=6))
        AdminModel.save_otp(email, otp)
        send_admin_otp_email(email, otp)
        return {"message": "OTP sent to email"}, 200

    @staticmethod
    def verify_otp(email, otp):
        if not email or not otp:
            return {"error": "Email and OTP required"}, 400
        ok = AdminModel.verify_otp(email, otp)
        if ok:
            AdminModel.delete_otp(email)
            return {"message": "OTP verified successfully", "admin_email": email}, 200
        return {"error": "Invalid or expired OTP"}, 401

    # ===== Providers =====
    @staticmethod
    def list_providers():
        providers = AdminModel.list_providers()
        print("\n🔍 Providers Result:", providers, "\n")

        provider_ids = [p['provider_id'] for p in providers]
        services = AdminModel.get_provider_services(provider_ids)

        # group services per provider
        svc_map = {}
        for s in services:
            pid = s['provider_id']
            svc_map.setdefault(pid, []).append({
                "service_name": s['service_name'],
                "service_rate": float(s['service_rate']),
                "region": s.get('region') or '',
                "state": s.get('state') or '',
                "city": s.get('city') or '',
                "service_location": ", ".join([v for v in [s.get('city'), s.get('state'), s.get('region')] if v])
            })

        for p in providers:
            arr = svc_map.get(p['provider_id'], [])
            p['services'] = arr
            p['service_locations'] = ", ".join(sorted({x['service_location'] for x in arr})) if arr else "N/A"
        return providers, 200

    @staticmethod
    def approve_provider(email):
        core = AdminModel.approve_provider(email)
        if not core:
            return {"error": "Provider not found or not pending"}, 404

        # FIX: use user_uid instead of provider_id
        user_uid = core["user_uid"]

        # fetch services
        services = AdminModel.get_provider_services([user_uid])

        # compose details for PDF
        details = {
            "Provider ID": user_uid,
            "Full Name": core['name'],
            "Email": email,
            "Phone Number": core['contact_number'],
            "Services": [
                {
                    "Service Name": s['service_name'],
                    "Service Rate": s['service_rate'],
                    "Service Location": s.get('state') or s.get('city') or 'N/A'
                }
                for s in services
            ]
        }

        pdf_path = generate_certificate_pdf(details, email)

        msg = (
            "Your provider profile has been approved. "
            "You can now submit your bank details."
        )

        AdminModel.insert_admin_message(email, msg, "approval")

        try:
            send_email(email, "Profile Approved", msg, pdf_path)
            return {"message": "Provider approved"}, 200
        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)


    @staticmethod
    def reject_provider(email):
        if not AdminModel.reject_provider(email):
            return {"error": "Provider not found or not pending"}, 404
        msg = "Your provider profile has been rejected. Please contact admin for more details."
        AdminModel.insert_admin_message(email, msg, "rejection")
        send_email(email, "Profile Rejected", msg)
        return {"message": "Provider rejected"}, 200

    @staticmethod
    def send_message_provider(email, message):
        if not email or not message:
            return {"error": "Email and message required"}, 400
        AdminModel.insert_admin_message(email, message, "message")
        send_email(email, "Message from Ontract Admin", message)
        return {"message": "Message sent and saved"}, 200

    # ===== Contractors =====
    @staticmethod
    def list_contractors():
        contractors = AdminModel.list_contractors()
        ids = [c['company_id'] for c in contractors]
        svcs = AdminModel.get_contractor_services_by_company_ids(ids)

        svc_map = {}
        for s in svcs:
            svc_map.setdefault(s['company_id'], []).append({
                "service_name": s['service_name'],
                "service_rate": float(s['service_rate']),
                "service_location": ", ".join(filter(None, [s.get("city"), s.get("state"), s.get("region")]))
            })


        for c in contractors:
            c['services'] = svc_map.get(c['company_id'], [])
        return contractors, 200

    @staticmethod
    def approve_contractor(email):
        if not AdminModel.approve_contractor(email):
            return {"error": "Company not found or not pending"}, 404

        company = AdminModel.get_contractor_by_email(email)
        print("company",company)
        services = AdminModel.get_contractor_services(company['user_uid'])
        print(services)
        details = {
            "Company ID": company['brn_number'],
            "Company Name": company['company_name'],
            "Name": company.get('name'),  # comes from users_t now
            "Email": company.get('email_id'),
            "Contact Number": company.get('contact_number'),
            "Services": [{
                "Service Name": s['service_name'],
                "Service Rate": s['service_rate'],
                "Service Location":  ", ".join(filter(None, [s.get("city"), s.get("state"), s.get("region")]))
            } for s in services]
        }

        pdf_path = generate_certificate_pdf(details, email)
        msg = "Your company has been approved. You can now proceed to submit bank details."
        AdminModel.insert_admin_message(email, msg, "approval")

        try:
            send_email(email, "Company Approved", msg, pdf_path)
            return {"message": "Contractor approved"}, 200
        finally:
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

    @staticmethod
    def reject_contractor(email):
        if not AdminModel.reject_contractor(email):
            return {"error": "Not found or already processed"}, 404
        msg = "Your company registration has been rejected. Contact admin for details."
        AdminModel.insert_admin_message(email, msg, "rejection")
        send_email(email, "Company Rejected", msg)
        return {"message": "Contractor rejected"}, 200

    @staticmethod
    def send_message_contractor(email, message):
        if not email or not message:
            return {"error": "Email and message required"}, 400
        AdminModel.insert_admin_message(email, message, "message")
        send_email(email, "Message from Admin", message)
        return {"message": "Message sent"}, 200

    # ===== Standard Rates =====
    # @staticmethod
    # def upload_excel(file_storage):
    #     if not file_storage or not file_storage.filename.lower().endswith(('.xlsx', '.xls')):
    #         return {"error": "Only Excel files are allowed"}, 400
    #     os.makedirs("uploads", exist_ok=True)
    #     path = os.path.join("uploads", file_storage.filename)
    #     file_storage.save(path)
    #     try:
    #         AdminModel.upload_standard_rate_excel(path)
    #         return {"message": "File uploaded and data saved"}, 200
    #     finally:
    #         if os.path.exists(path):
    #             os.remove(path)

    # @staticmethod
    # def list_standard_rates():
    #     return AdminModel.list_standard_rates(), 200

    # @staticmethod
    # def add_standard_rate(payload):
    #     AdminModel.add_or_upsert_standard_rate(
    #         payload['service_name'],
    #         payload['service_location'],
    #         payload['service_rate'],
    #         payload['client']
    #     )
    #     return {"message": "Rate added"}, 201

    # @staticmethod
    # def update_standard_rate(rate_id, payload):
    #     AdminModel.update_standard_rate_by_id(
    #         rate_id,
    #         payload['service_name'],
    #         payload['service_location'],
    #         payload['service_rate'],
    #         payload['client']
    #     )
    #     return {"message": "Rate updated"}, 200

    # @staticmethod
    # def delete_standard_rate(rate_id):
    #     AdminModel.delete_standard_rate_by_id(rate_id)
    #     return {"message": "Rate deleted"}, 200

    # @staticmethod
    # def list_rates_compact():
    #     return AdminModel.list_rates_compact(), 200

    @staticmethod
    def upload_excel(file_storage):
        # Basic file validation
        if not file_storage or not getattr(file_storage, "filename", None):
            return {"error": "No file provided"}, 400
        fname = file_storage.filename.lower()
        if not fname.endswith(('.xlsx', '.xls')):
            return {"error": "Only Excel files are allowed (.xlsx, .xls)"}, 400

        tmp_dir = tempfile.mkdtemp(prefix="upload_excel_")
        tmp_path = os.path.join(tmp_dir, file_storage.filename)
        try:
            file_storage.save(tmp_path)
            result = AdminModel.upload_standard_rate_excel(tmp_path)
            return {"message": "Import completed", "result": result}, 200
        except Exception as e:
            current_app.logger.exception("Excel upload failed")
            return {"error": str(e)}, 500
        finally:
            try:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
                if os.path.exists(tmp_dir):
                    os.rmdir(tmp_dir)
            except Exception:
                pass

    @staticmethod
    def list_standard_rates(params):
        try:
            print(params)
            res = AdminModel.list_standard_rates(params)
            return res, 200
        except Exception as e:
            current_app.logger.exception("List rates failed")
            return {"error": str(e)}, 500

    @staticmethod
    def add_standard_rate(payload):
        try:
            AdminModel.add_standard_rate(payload)
            return {"message": "Rate added"}, 201
        except Exception as e:
            current_app.logger.exception("Add rate failed")
            return {"error": str(e)}, 500

    @staticmethod
    def update_standard_rate(rate_id, payload):
        try:
            AdminModel.update_standard_rate(rate_id, payload)
            return {"message": "Rate updated"}, 200
        except Exception as e:
            current_app.logger.exception("Update rate failed")
            return {"error": str(e)}, 500

    @staticmethod
    def delete_standard_rate(rate_id):
        try:
            AdminModel.delete_standard_rate(rate_id)
            return {"message": "Rate deleted"}, 200
        except Exception as e:
            current_app.logger.exception("Delete rate failed")
            return {"error": str(e)}, 500