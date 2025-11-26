from datetime import datetime, timedelta
from sqlalchemy.sql import text
from app.models.database import db


class ProviderModel:

    # ============================================================
    #  SECTION 1 — ACCOUNT CREATION USING users_t + providers_t
    # ============================================================

    @staticmethod
    def insert_provider(email, hashed_pw, phone, token):
        """Create base user record + provider profile."""
        
        # Step 1: insert into users_t
        sql_user = text("""
            INSERT INTO users_t 
            (email_id, password_hash, contact_number, activation_token, active_status, status, service_type, created_at)
            VALUES (:email, :pw, :phone, :token, :active, :status, 0, NOW())
            RETURNING user_uid
        """)
        
        user_uid = db.session.execute(sql_user, {
            "email": email,
            "pw": hashed_pw,
            "phone": phone,
            "token": token,
            "active": False,
            "status": "registered"
        }).fetchone()[0]

        # Step 2: create provider entry linked by user_uid
        sql_provider = text("""
            INSERT INTO providers_t (user_uid) VALUES (:uid)
        """)
        db.session.execute(sql_provider, {"uid": user_uid})

        db.session.commit()

        return user_uid

    @staticmethod
    def get_provider_by_token(token):
        sql = text("SELECT email_id FROM users_t WHERE activation_token = :token AND service_type = 0")
        row = db.session.execute(sql, {"token": token}).fetchone()
        return dict(row._mapping) if row else None

    @staticmethod
    def activate_account(token):
        sql = text("""
            UPDATE users_t 
            SET active_status = TRUE 
            WHERE activation_token = :token AND service_type = 0
        """)
        db.session.execute(sql, {"token": token})
        db.session.commit()

    @staticmethod
    def get_provider_login(email):
        sql = text("""
            SELECT password_hash, active_status, service_type 
            FROM users_t 
            WHERE email_id = :email
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return dict(row._mapping) if row else None

    # ============================================================
    #  SECTION 2 — OTP (NO CHANGES REQUIRED)
    # ============================================================

    @staticmethod
    def insert_otp(email, otp):
        sql = text("INSERT INTO otp_codes_t (email_id, otp_code) VALUES (:email, :otp)")
        db.session.execute(sql, {"email": email, "otp": otp})
        db.session.commit()

    @staticmethod
    def get_otp(email):
        sql = text("""
            SELECT otp_code 
            FROM otp_codes_t
            WHERE email_id = :email
              AND created_at > (NOW() - INTERVAL '5 minutes')
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return dict(row._mapping) if row else None

    @staticmethod
    def delete_otp(email):
        sql = text("DELETE FROM otp_codes_t WHERE email_id = :email")
        db.session.execute(sql, {"email": email})
        db.session.commit()

    # ============================================================
    #  SECTION 3 — PASSWORD RESET (NEW TABLE REFERENCE)
    # ============================================================

    @staticmethod
    def set_reset_token(email, token):
        expiry = datetime.now() + timedelta(minutes=10)
        sql = text("""
            UPDATE users_t 
            SET reset_token = :token, reset_expiry = :expiry
            WHERE email_id = :email
        """)
        db.session.execute(sql, {"token": token, "expiry": expiry, "email": email})
        db.session.commit()

    @staticmethod
    def get_reset_info(email):
        sql = text("""
            SELECT reset_token, reset_expiry 
            FROM users_t 
            WHERE email_id = :email
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return dict(row._mapping) if row else None

    @staticmethod
    def update_password(email, hashed):
        sql = text("""
            UPDATE users_t 
            SET password_hash = :pw, reset_token = NULL, reset_expiry = NULL
            WHERE email_id = :email
        """)
        db.session.execute(sql, {"pw": hashed, "email": email})
        db.session.commit()

    # ============================================================
    #  SECTION 4 — PROVIDER PROFILE (NOW SPLIT USERS + PROVIDER TABLE)
    # ============================================================

    @staticmethod
    def get_provider(email):
        sql = text("""
            SELECT 
                u.user_uid, u.email_id, u.name, u.contact_number, u.alternate_contact_number, 
                u.billing_address, u.mailing_address, u.tin_number, u.status,
                p.provider_id, p.id_type, p.id_number, 
                p.profile_pic, p.authorized_certificate
            FROM users_t u
            JOIN providers_t p ON p.user_uid = u.user_uid
            WHERE u.email_id = :email
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        print(dict(row._mapping))
        return dict(row._mapping) if row else None

    @staticmethod
    def update_status(email, status):
        sql = text("UPDATE users_t SET status=:status WHERE email_id=:email")
        db.session.execute(sql, {"status": status, "email": email})
        db.session.commit()

    @staticmethod
    def update_provider(email, data):
        """Update shared values in users_t and provider-specific in providers_t"""

        # Update users_t
        sql_user = text("""
            UPDATE users_t
            SET name = :full_name,
                mailing_address = :mailing_address,
                billing_address = :billing_address,
                contact_number = :contact_number,
                alternate_contact_number = :alternate_contact,
                tin_number = :tin_number,
                status = 'pending'
            WHERE email_id = :email
        """)

        db.session.execute(sql_user, {
            "full_name": data["full_name"],
            "mailing_address": data["mailing_address"],
            "billing_address": data["billing_address"],
            "contact_number": data["contact_number"],
            "alternate_contact": data["alternate_contact_number"],
            "tin_number": data["tin_number"],
            "email": email
        })

        # Update providers_t
        sql_provider = text("""
            UPDATE providers_t
            SET id_type = :id_type,
                id_number = :id_number,
                profile_pic = :profile_pic,
                authorized_certificate = :certificate
            WHERE user_uid = (SELECT user_uid FROM users_t WHERE email_id = :email)
        """)

        db.session.execute(sql_provider, {
            "id_type": data["id_type"],
            "id_number": data["id_number"],
            "profile_pic": data["profile_pic"],
            "certificate": data["authorized_certificate"],
            "email": email
        })

        db.session.commit()

    # ============================================================
    #  SECTION 5 — SERVICES (NOW IN services_t)
    # ============================================================

    @staticmethod
    def delete_services(user_uid):
        sql = text("DELETE FROM services_t WHERE user_uid = :uid AND service_type = 0")
        db.session.execute(sql, {"uid": user_uid})
        db.session.commit()

    @staticmethod
    def insert_services(user_uid, bulk_data):
        sql = text("""
            INSERT INTO services_t 
                (user_uid, service_type, service_name, service_rate, region, state, city)
            VALUES (:uid, 0, :service_name, :service_rate, :region, :state, :city)
        """)

        data = [{
            "uid": user_uid,
            "service_name": r[0],
            "service_rate": r[1],
            "region": r[2],
            "state": r[3],
            "city": r[4],
        } for r in bulk_data]

        db.session.execute(sql, data)
        db.session.commit()

    @staticmethod
    def get_services(user_uid):
        sql = text("""
            SELECT service_name, service_rate, region, state, city
            FROM services_t
            WHERE user_uid = :uid AND service_type = 0
            ORDER BY created_at
        """)
        rows = db.session.execute(sql, {"uid": user_uid}).fetchall()
        return [dict(r._mapping) for r in rows]

    # ============================================================
    #  SECTION 6 — BANK DETAILS (NO CHANGE EXCEPT ID RESOLUTION)
    # ============================================================

    @staticmethod
    def get_provider_id(email):
        sql = text("""
            SELECT provider_id 
            FROM providers_t
            WHERE user_uid = (SELECT user_uid FROM users_t WHERE email_id = :email)
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return dict(row._mapping) if row else None

    @staticmethod
    def get_bank(provider_id):
        sql = text("""
            SELECT bank_name, swift_code, bank_account_number, 
                   account_holder_name, bank_statement
            FROM providers_bank_details_t
            WHERE provider_id = :id
            LIMIT 1
        """)
        row = db.session.execute(sql, {"id": provider_id}).fetchone()

        if not row:
            return None

        bank = dict(row._mapping)

        # Convert memoryview → bytes
        for k, v in bank.items():
            if isinstance(v, memoryview):
                bank[k] = v.tobytes()

        return bank

    @staticmethod
    def update_bank(provider_id, bank_name, swift, acc, holder, statement):
        sql = text("""
            UPDATE providers_bank_details_t
            SET 
                bank_name = :bank_name,
                swift_code = :swift,
                bank_account_number = :acc,
                account_holder_name = :holder,
                bank_statement = :statement
            WHERE provider_id = :provider_id
        """)
        db.session.execute(sql, {
            "provider_id": provider_id,
            "bank_name": bank_name,
            "swift": swift,
            "acc": acc,
            "holder": holder,
            "statement": statement
        })
        db.session.commit()

    @staticmethod
    def insert_bank(provider_id, bank_name, swift, acc, holder, statement):
        sql = text("""
            INSERT INTO providers_bank_details_t 
                (provider_id, bank_name, swift_code, bank_account_number, account_holder_name, bank_statement)
            VALUES 
                (:provider_id, :bank_name, :swift, :acc, :holder, :statement)
        """)
        db.session.execute(sql, {
            "provider_id": provider_id,
            "bank_name": bank_name,
            "swift": swift,
            "acc": acc,
            "holder": holder,
            "statement": statement
        })
        db.session.commit()
