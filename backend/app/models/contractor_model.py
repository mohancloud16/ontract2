from sqlalchemy.sql import text
from datetime import datetime
from app.models.database import db
from app.utils.encrypt_utils import decrypt_value
import base64

class ContractorModel:

    # ---------------- CREATE COMPANY (users_t + company_details_t) ----------------
    @staticmethod
    def create_company(company_name, brn, hashed_password, phone, email, activation_token):

        # Step 1 — create user entry
        sql_user = text("""
            INSERT INTO users_t 
            (email_id, password_hash, contact_number, activation_token, active_status, 
             status, service_type, created_at)
            VALUES (:email, :pw, :phone, :token, FALSE, 'registered', 1, NOW())
            RETURNING user_uid
        """)

        user_uid = db.session.execute(sql_user, {
            "email": email,
            "pw": hashed_password,
            "phone": phone,
            "token": activation_token
        }).fetchone()[0]

        # Step 2 — create company entry
        sql_company = text("""
            INSERT INTO company_details_t 
            (user_uid, company_name, brn_number)
            VALUES (:uid, :name, :brn)
        """)

        db.session.execute(sql_company, {
            "uid": user_uid,
            "name": company_name,
            "brn": brn
        })

        db.session.commit()
        return user_uid

    # ---------------- GET COMPANY VIA TOKEN ----------------
    @staticmethod
    def get_company_by_token(token):
        sql = text("""
            SELECT email_id 
            FROM users_t 
            WHERE activation_token = :token AND service_type = 1
        """)
        row = db.session.execute(sql, {"token": token}).fetchone()
        return dict(row._mapping) if row else None

    # ---------------- ACTIVATE COMPANY ----------------
    @staticmethod
    def activate_company(token):
        print(token)
        sql = text("""
            UPDATE users_t
            SET active_status = TRUE, status = 'pending'
            WHERE activation_token = :token AND service_type = 1
        """)
        result = db.session.execute(sql, {"token": token})
        print(result)
        db.session.commit()
        return result.rowcount > 0

    # ---------------- LOGIN ----------------
    @staticmethod
    def get_contractor_by_email(email):
        sql = text("""
            SELECT password_hash, active_status, service_type 
            FROM users_t 
            WHERE email_id = :email
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return dict(row._mapping) if row else None

    # ---------------- OTP ----------------
    @staticmethod
    def save_otp(email, otp):
        db.session.execute(
            text("INSERT INTO otp_codes_t (email_id, otp_code) VALUES (:email, :otp)"),
            {"email": email, "otp": otp}
        )
        db.session.commit()

    @staticmethod
    def validate_otp(email):
        sql = text("""
            SELECT otp_code FROM otp_codes_t
            WHERE email_id = :email
              AND created_at > NOW() - INTERVAL '5 minutes'
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return dict(row._mapping) if row else None

    @staticmethod
    def delete_otp(email):
        db.session.execute(text("DELETE FROM otp_codes_t WHERE email_id = :email"), {"email": email})
        db.session.commit()

    # ---------------- BASIC INFO ----------------
    @staticmethod
    def get_basic_info(email):
        sql = text("""
            SELECT c.company_id, u.email_id, u.contact_number, c.company_name, u.status
            FROM users_t u
            JOIN company_details_t c ON u.user_uid = c.user_uid
            WHERE u.email_id = :email
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return dict(row._mapping) if row else None

    # ---------------- FULL PROFILE ----------------
    @staticmethod
    def get_company_profile(email):

        # ---- Fetch base company + user info ----
        sql = text("""
            SELECT 
                u.user_uid, u.email_id, u.contact_number, u.mailing_address, u.billing_address,
                u.alternate_contact_number, u.tin_number, u.status,
                c.company_id, c.company_name, c.brn_number, c.logo_path, c.certificate_path,
                u.name  -- needed for admin approval mail
            FROM users_t u
            JOIN company_details_t c ON u.user_uid = c.user_uid
            WHERE u.email_id = :email
        """)

        row = db.session.execute(sql, {"email": email}).fetchone()
        if not row:
            return None

        company = dict(row._mapping)

        # ---- Fetch services ----
        sql_services = text("""
            SELECT service_name, service_rate, region, state, city
            FROM services_t
            WHERE user_uid = :uid AND service_type = 1
            ORDER BY created_at
        """)

        services = db.session.execute(sql_services, {"uid": company["user_uid"]}).fetchall()
        company["services"] = [dict(s._mapping) for s in services]

        # ---- Fetch Bank Details ----
        sql_bank = text("""
            SELECT bank_name, swift_code, holder_name, account_number, bank_statement
            FROM company_bank_details_t
            WHERE company_id = :cid
        """)

        bank_row = db.session.execute(sql_bank, {"cid": company["company_id"]}).fetchone()

        if bank_row:
            # Convert DB row into clean JSON structure
            bank = dict(bank_row._mapping)

            company["bank_details"] = {
                "bank_name": bank["bank_name"],
                "swift": decrypt_value(bank["swift_code"]) if bank["swift_code"] else None,
                "holder_name": decrypt_value(bank["holder_name"]) if bank["holder_name"] else None,
                "account_number": decrypt_value(bank["account_number"]) if bank["account_number"] else None,
                "bank_statement": base64.b64encode(bank["bank_statement"]).decode()
                if bank.get("bank_statement") else None
            }
        else:
            company["bank_details"] = None

        return company


    # ---------------- UPDATE PROFILE ----------------
    @staticmethod
    def update_company_profile(email, data, services, logo_bytes, cert_bytes):

        # Update common fields in users_t
        sql_user = text("""
            UPDATE users_t
            SET 
                name = :head_name,
                mailing_address = :mailing,
                billing_address = :billing,
                contact_number = :contact,
                alternate_contact_number = :alternate,
                tin_number = :tin,
                status = 'pending'
            WHERE email_id = :email
        """)

        db.session.execute(sql_user, {
            "head_name": data["contact_person"],
            "mailing": data["mailing_address"],
            "billing": data["billing_address"],
            "contact": data["contact_number"],
            "alternate": data["alternate_contact"],
            "tin": data["tin_number"],
            "email": email
        })

        # Update company specific info
        sql_company = text("""
            UPDATE company_details_t
            SET company_name = :name, brn_number = :brn,
                logo_path = COALESCE(:logo, logo_path),
                certificate_path = COALESCE(:cert, certificate_path)
            WHERE user_uid = (SELECT user_uid FROM users_t WHERE email_id = :email)
        """)

        db.session.execute(sql_company, {
            "name": data["company_name"],
            "brn": data["brn_number"],
            "logo": logo_bytes,
            "cert": cert_bytes,
            "email": email
        })

        # Update services (clear + add new)
        user_uid_sql = text("SELECT user_uid FROM users_t WHERE email_id = :email")
        uid = db.session.execute(user_uid_sql, {"email": email}).fetchone()[0]

        db.session.execute(text("DELETE FROM services_t WHERE user_uid = :uid AND service_type = 1"), {"uid": uid})

        for svc in services:
            db.session.execute(text("""
                INSERT INTO services_t (user_uid, service_type, service_name, service_rate, region, state, city)
                VALUES (:uid, 1, :name, :rate, :region, :state, :city)
            """), {
                "uid": uid,
                "name": svc["service_name"],
                "rate": svc["service_rate"],
                "region": svc.get("service_region", None),
                "state": svc.get("service_location", None),
                "city": svc.get("city", None)
            })

        db.session.commit()
        return True


    # ---------------- UPDATE BANK ----------------
    @staticmethod
    def update_company_bank(email, bank_details, statement_bytes):
        try:
            # Step 1: Fetch company_id using updated structure
            sql_id = text("""
                SELECT c.company_id 
                FROM company_details_t c
                JOIN users_t u ON u.user_uid = c.user_uid
                WHERE u.email_id = :email
            """)
            
            row = db.session.execute(sql_id, {"email": email}).mappings().fetchone()
            if not row:
                print("Company lookup failed for email:", email)
                return False

            company_id = row["company_id"]

            # Step 2: Insert/update bank info
            sql_upsert = text("""
                INSERT INTO company_bank_details_t 
                    (company_id, swift_code, holder_name, account_number, bank_name, created_at)
                VALUES (:id, :swift, :holder, :acc, :bank, NOW())
                ON CONFLICT (company_id) DO UPDATE SET
                    swift_code = EXCLUDED.swift_code,
                    holder_name = EXCLUDED.holder_name,
                    account_number = EXCLUDED.account_number,
                    updated_at = NOW()
            """)

            db.session.execute(sql_upsert, {
                "id": company_id,
                "swift": bank_details["swift_enc"],
                "holder": bank_details["holder_name"],
                "acc": bank_details["account_number_enc"],
                "bank": bank_details["bank_name"]
            })

            # Step 3: Update bank statement (optional)
            if statement_bytes:
                sql_statement = text("""
                    UPDATE company_bank_details_t
                    SET bank_statement = :statement
                    WHERE company_id = :id
                """)
                db.session.execute(sql_statement, {
                    "statement": statement_bytes,
                    "id": company_id
                })

            db.session.commit()
            return True

        except Exception as e:
            print("Bank update error:", e)
            db.session.rollback()
            return False


    # ---------------- NOTIFICATIONS ----------------
    @staticmethod
    def fetch_notifications(email):
        sql = text("""
            SELECT message_id, message, sent_at, is_read, notification_type
            FROM admin_messages_t
            WHERE email_id = :email
            ORDER BY sent_at DESC
        """)
        rows = db.session.execute(sql, {"email": email}).fetchall()
        return [dict(r._mapping) for r in rows]

    @staticmethod
    def fetch_unread_count(email):
        sql = text("""
            SELECT COUNT(*) AS count
            FROM admin_messages_t
            WHERE email_id = :email AND is_read = FALSE
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return row._mapping["count"] if row else 0

    @staticmethod
    def mark_notification_read(message_id):
        sql = text("""
            UPDATE admin_messages_t 
            SET is_read = TRUE 
            WHERE message_id = :id
        """)
        result = db.session.execute(sql, {"id": message_id})
        db.session.commit()
        return result.rowcount > 0