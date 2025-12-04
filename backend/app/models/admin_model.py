from sqlalchemy.sql import text
from app.models.database import db
import pandas as pd
from difflib import SequenceMatcher
import re
import io
from flask import current_app

SIMILARITY_THRESHOLD = 0.70

CANONICAL_FIELDS = [
    "trade", "category_item", "equipment_type", "sub_type", "brand",
    "description", "unit", "copper_pipe_price", "price_rm", "client", "extra_col", "source_row_number"
]

VARIATIONS = {
    "trade": ["trade", "trades"],
    "category_item": ["category item", "category/item", "category", "item", "categoryitem"],
    "equipment_type": ["equipment type", "equipment/type", "type", "equipment", "Type"],
    "sub_type": ["sub type", "sub-type", "subtype"],
    "brand": ["brand", "manufacture", "manufacturer", "make"],
    "description": ["description", "descriptions", "desc", "item description"],
    "unit": ["unit", "uom", "units"],
    "price_rm": ["price rm", "price", "rate", "rate (rm)"],
    "copper_pipe_price": ["copper pipe price", "copper price", "Copper Pipe  Price (RM)"],
    "client" : ["client", "Client"],
    "extra_col": ["unnamed", "extra", "notes", ""]
}


def normalize_header(h):
    if h is None:
        return ""
    s = str(h).strip().lower()
    s = re.sub(r"unnamed:\s*\d+", "unnamed", s)
    s = re.sub(r"[^\w\s/]", " ", s)
    s = s.replace("/", " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def find_best_field(normalized_header):
    """
    Matches a normalized header to the closest canonical field using similarity rules & keyword variations.
    """
    best_match = None
    best_score = 0.0

    # direct match in canonical fields
    if normalized_header in CANONICAL_FIELDS:
        return normalized_header

    # search variations
    for canonical, variations in VARIATIONS.items():
        for variant in variations:
            score = similarity(normalized_header.lower(), variant.lower())
            if score > best_score:
                best_score = score
                best_match = canonical

    return best_match if best_score >= SIMILARITY_THRESHOLD else None

def parse_numeric(value):
    """
    Converts numeric-like strings to float. Handles commas and non-numeric garbage safely.
    Returns None if not numeric.
    """
    if value is None:
        return None

    val = str(value).strip()

    # Return None if explicitly empty or non-numeric placeholder
    if val == "" or val.lower() in ["na", "n/a", "-", "--"]:
        return None

    # Remove currency symbols or commas
    val = re.sub(r"[^\d.-]", "", val)

    try:
        return float(val)
    except ValueError:
        return None


def similarity(a, b): return SequenceMatcher(None, a, b).ratio()


class AdminModel:

    # ======================= ADMIN AUTH =======================
    @staticmethod
    def get_admin_by_email(email):
        sql = text("SELECT * FROM admins_t WHERE email = :email")
        row = db.session.execute(sql, {"email": email}).fetchone()
        return dict(row._mapping) if row else None

    @staticmethod
    def save_otp(email, otp):
        db.session.execute(
            text("INSERT INTO otp_codes_t (email_id, otp_code, created_at) VALUES (:email, :otp, NOW())"),
            {"email": email, "otp": otp}
        )
        db.session.commit()

    @staticmethod
    def verify_otp(email, otp):
        sql = text("""
            SELECT otp_code FROM otp_codes_t
            WHERE email_id = :email AND created_at > NOW() - INTERVAL '5 minutes'
            ORDER BY created_at DESC LIMIT 1
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        return bool(row and row._mapping["otp_code"] == otp)

    @staticmethod
    def delete_otp(email):
        db.session.execute(text("DELETE FROM otp_codes_t WHERE email_id = :email"), {"email": email})
        db.session.commit()

    # ======================= PROVIDERS =======================
    @staticmethod
    def list_providers():
        sql = text("""
            SELECT 
                p.provider_id, u.name, u.email_id, u.contact_number, u.status,
                p.id_type, p.id_number, u.mailing_address, u.billing_address,
                u.alternate_contact_number, u.tin_number, u.created_at
            FROM users_t u
            JOIN providers_t p ON u.user_uid = p.user_uid
            WHERE u.service_type = 0
            ORDER BY u.created_at DESC
        """)
        rows = db.session.execute(sql).fetchall()
        return [dict(r._mapping) for r in rows]

    @staticmethod
    def get_provider_services(provider_ids):
        if not provider_ids:
            return []

        sql = text("""
            SELECT 
            p.provider_id,
            s.service_name,
            s.service_rate,
            s.region,
            s.state,
            s.city
        FROM services_t s
        JOIN providers_t p ON s.user_uid = p.user_uid
        WHERE p.provider_id = ANY(:ids)
          AND s.service_type = 0
        """)
        rows = db.session.execute(sql, {"ids": provider_ids}).fetchall()
        return [dict(row._mapping) for row in rows]




    @staticmethod
    def approve_provider(email):
        sql = text("""
            UPDATE users_t
            SET status = 'approved'
            WHERE email_id = :email AND status = 'pending' AND service_type = 0
            RETURNING user_uid, name, contact_number
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        db.session.commit()
        return dict(row._mapping) if row else None

    @staticmethod
    def reject_provider(email):
        sql = text("""
            UPDATE users_t 
            SET status = 'rejected'
            WHERE email_id = :email AND status = 'pending' AND service_type = 0
        """)
        result = db.session.execute(sql, {"email": email})
        db.session.commit()
        return result.rowcount > 0

    # ======================= CONTRACTORS (COMPANIES) =======================
    @staticmethod
    def list_contractors():
        sql = text("""
            SELECT c.company_id, c.company_name, u.email_id, u.contact_number, u.status, c.brn_number
            FROM users_t u
            JOIN company_details_t c ON u.user_uid = c.user_uid
            WHERE u.service_type = 1
            ORDER BY u.created_at DESC
        """)
        rows = db.session.execute(sql).fetchall()
        return [dict(r._mapping) for r in rows]

    @staticmethod
    def get_contractor_services_by_company_ids(company_ids):
        if not company_ids:
            return []

        sql = text("""
            SELECT c.company_id, s.service_name, s.service_rate, s.region, s.state, s.city
            FROM services_t s
            JOIN company_details_t c ON s.user_uid = c.user_uid
            WHERE c.company_id = ANY(:ids) AND s.service_type = 1
        """)

        rows = db.session.execute(sql, {"ids": company_ids}).fetchall()
        return [dict(r._mapping) for r in rows]



    @staticmethod
    def get_contractor_services(user_uid):
        sql = text("""
            SELECT service_name, service_rate, region, state, city
            FROM services_t
            WHERE user_uid = :uid AND service_type = 1
        """)
        rows = db.session.execute(sql, {"uid": user_uid}).fetchall()
        print("rows",rows,user_uid)
        return [dict(r._mapping) for r in rows]

    @staticmethod
    def get_contractor_by_email(email):
        sql = text("""
            SELECT 
                u.user_uid, u.email_id, u.name, u.contact_number, u.status,
                c.company_id, c.company_name, c.brn_number
            FROM users_t u
            JOIN company_details_t c ON u.user_uid = c.user_uid
            WHERE u.email_id = :email
        """)
        row = db.session.execute(sql, {"email": email}).fetchone()
        print("email",row)
        return dict(row._mapping) if row else None


    @staticmethod
    def approve_contractor(email):
        sql = text("""
            UPDATE users_t 
            SET status='approved'
            WHERE email_id=:email AND status='pending' AND service_type = 1
        """)
        result = db.session.execute(sql, {"email": email})
        db.session.commit()
        return result.rowcount > 0

    @staticmethod
    def reject_contractor(email):
        sql = text("""
            UPDATE users_t 
            SET status='rejected'
            WHERE email_id=:email AND status='pending' AND service_type = 1
        """)
        result = db.session.execute(sql, {"email": email})
        db.session.commit()
        return result.rowcount > 0

    # ======================= NOTIFICATIONS =======================
    @staticmethod
    def insert_admin_message(email, message, notification_type):
        sql = text("""
            INSERT INTO admin_messages_t (email_id, message, sent_at, is_read, notification_type)
            VALUES (:email, :msg, NOW(), FALSE, :ntype)
        """)
        db.session.execute(sql, {
            "email": email,
            "msg": message,
            "ntype": notification_type
        })
        db.session.commit()

    # =======================
    # STANDARD RATES
    # =======================
    # @staticmethod
    # def upload_standard_rate_excel(saved_path):
    #     df = pd.read_excel(saved_path)
    #     required = {'service_name', 'service_location', 'service_rate', 'client'}

    #     if not required.issubset(df.columns):
    #         raise ValueError("Missing required columns")

    #     sql = text("""
    #         INSERT INTO standard_rates_t 
    #             (service_name, service_location, service_rate, client)
    #         VALUES 
    #             (:name, :loc, :rate, :client)
    #         ON CONFLICT (service_name, service_location)
    #         DO UPDATE SET 
    #             service_rate = EXCLUDED.service_rate,
    #             client = EXCLUDED.client
    #     """)

    #     for _, row in df.iterrows():
    #         db.session.execute(sql, {
    #             "name": row["service_name"],
    #             "loc": row["service_location"],
    #             "rate": row["service_rate"],
    #             "client": row["client"]
    #         })

    #     db.session.commit()

    # @staticmethod
    # def list_standard_rates():
    #     sql = text("SELECT * FROM standard_rates_t ORDER BY service_name, service_location")
    #     rows = db.session.execute(sql).fetchall()
    #     return [dict(r._mapping) for r in rows]

    # @staticmethod
    # def add_or_upsert_standard_rate(service_name, service_location, service_rate, client):
    #     sql = text("""
    #         INSERT INTO standard_rates_t (service_name, service_location, service_rate, client)
    #         VALUES (:name, :loc, :rate, :client)
    #         ON CONFLICT (service_name, service_location)
    #         DO UPDATE SET 
    #             service_rate = EXCLUDED.service_rate,
    #             client = EXCLUDED.client
    #     """)
    #     db.session.execute(sql, {
    #         "name": service_name,
    #         "loc": service_location,
    #         "rate": service_rate,
    #         "client": client
    #     })
    #     db.session.commit()

    # @staticmethod
    # def update_standard_rate_by_id(rate_id, service_name, service_location, service_rate, client):
    #     sql = text("""
    #         UPDATE standard_rates_t
    #         SET service_name=:name, service_location=:loc, 
    #             service_rate=:rate, client=:client
    #         WHERE id=:id
    #     """)
    #     db.session.execute(sql, {
    #         "id": rate_id,
    #         "name": service_name,
    #         "loc": service_location,
    #         "rate": service_rate,
    #         "client": client
    #     })
    #     db.session.commit()

    # @staticmethod
    # def delete_standard_rate_by_id(rate_id):
    #     sql = text("DELETE FROM standard_rates_t WHERE id = :id")
    #     db.session.execute(sql, {"id": rate_id})
    #     db.session.commit()

    # @staticmethod
    # def list_rates_compact():
    #     sql = text("""
    #         SELECT id, service_name, service_location, service_rate, client
    #         FROM standard_rates_t
    #         ORDER BY service_name, service_location
    #     """)
    #     rows = db.session.execute(sql).fetchall()
    #     return [dict(r._mapping) for r in rows]

    @staticmethod
    def upload_standard_rate_excel(saved_path: str):

        current_app.logger.info("Import start: %s", saved_path)

        xls = pd.read_excel(saved_path, sheet_name=None)
        overall_summary = {
            "sheets": {},
            "inserted": 0,
            "updated": 0,
            "skipped": 0,
            "errors": []
        }

        combined_rows = []

        # -----------------------------------------------------------
        # 1) Read all sheets & normalize rows
        # -----------------------------------------------------------
        for sheet_name, df in xls.items():
            if df is None or df.empty:
                overall_summary["sheets"][sheet_name] = {"rows": 0, "skipped": 0}
                continue

            df = df.fillna("")
            original_headers = list(df.columns)
            normalized = [normalize_header(h) for h in original_headers]

            header_to_field = {}
            used_fields = set()

            for orig, norm in zip(original_headers, normalized):
                field = find_best_field(norm)
                if field is None:
                    field = "extra_col"
                if field in used_fields and field != "extra_col":
                    field = "extra_col"
                header_to_field[orig] = field
                used_fields.add(field)

            rows_count = 0
            skipped = 0

            for idx, row in df.iterrows():
                rows_count += 1
                params = {
                    "source_row_number": idx + 2,
                    "trade": None,
                    "category_item": None,
                    "equipment_type": None,
                    "sub_type": None,
                    "brand": None,
                    "description": None,
                    "unit": None,
                    "copper_pipe_price": None,
                    "price_rm": None,
                    "client": None,
                    "extra_col": None,
                    "sheet_name": sheet_name
                }

                extra_vals = []

                for orig_col in original_headers:
                    mapped = header_to_field.get(orig_col, "extra_col")
                    val = str(row[orig_col]).strip()

                    if mapped in ("trade", "category_item", "equipment_type", "sub_type",
                                "brand", "description", "unit"):
                        params[mapped] = val if val else None

                    elif mapped == "price_rm":
                        params["price_rm"] = parse_numeric(val)
                    elif mapped == "copper_pipe_price":
                        # Store values like "INCLUDED"
                        params["copper_pipe_price"] = val if val else None

                    else:
                        if val:
                            extra_vals.append(val)

                # if not params["trade"] or not params["category_item"]:
                #     skipped += 1
                #     continue

                params["extra_col"] = " | ".join(extra_vals) if extra_vals else None

                combined_rows.append(params)

            overall_summary["sheets"][sheet_name] = {"rows": rows_count, "skipped": skipped}

        # No valid rows
        if not combined_rows:
            return overall_summary

        # -----------------------------------------------------------
        # 2) Create DataFrame for staging
        # -----------------------------------------------------------
        df_final = pd.DataFrame(combined_rows)

        # normalize to text
        df_final["copper_pipe_price"] = df_final["copper_pipe_price"].astype(str).str.strip()       

        df_final["price_rm"] = df_final["price_rm"].astype("float").where(df_final["price_rm"].notnull(), None)

        # -----------------------------------------------------------
        # REMOVE ALL DUPLICATES BEFORE COPY (FINAL FIX)
        # -----------------------------------------------------------
        df_final["trade"] = df_final["trade"].str.strip().str.lower()
        df_final["category_item"] = df_final["category_item"].str.strip().str.lower()
        df_final["equipment_type"] = df_final["equipment_type"].str.strip().str.lower()
        df_final["description"] = df_final["description"].str.strip().str.lower()
        df_final["unit"] = df_final["unit"].str.strip().str.lower()

        df_final.drop_duplicates(
            subset=["trade", "category_item", "equipment_type", "description", "unit"],
            inplace=True
        )


        csv_buffer = io.StringIO()
        df_final.to_csv(csv_buffer, index=False, header=True)
        csv_buffer.seek(0)

        # -----------------------------------------------------------
        # 3) Use ONE raw PostgreSQL connection for all steps
        # -----------------------------------------------------------
        engine = db.engine
        raw_conn = engine.raw_connection()
        cur = raw_conn.cursor()

        try:
            # 3.1 CREATE TEMP TABLE
            cur.execute("""
                CREATE TEMP TABLE staging_standard_rates_t (
                    source_row_number INTEGER,
                    trade VARCHAR(255),
                    category_item VARCHAR(255),
                    equipment_type VARCHAR(255),
                    sub_type VARCHAR(255),
                    brand VARCHAR(255),
                    description TEXT,
                    unit VARCHAR(50),
                    copper_pipe_price TEXT,
                    price_rm NUMERIC(14,2),
                    client VARCHAR(255),
                    extra_col TEXT,
                    sheet_name VARCHAR(100)
                ) ON COMMIT DROP;
            """)

            # 3.2 COPY CSV → TEMP TABLE
            copy_sql = """
                COPY staging_standard_rates_t
                (source_row_number, trade, category_item, equipment_type, sub_type,
                brand, description, unit, copper_pipe_price, price_rm, client, extra_col, sheet_name)
                FROM STDIN WITH CSV HEADER DELIMITER ',' NULL ''
            """
            cur.copy_expert(copy_sql, csv_buffer)

            # raw_conn.commit()  # COPY must commit inside same session

            # 3.3 MERGE using SAME connection (with DISTINCT FIX)
            cur.execute("""
                INSERT INTO standard_rates_t
                    (source_row_number, trade, category_item, equipment_type, sub_type, brand,
                     description, unit, copper_pipe_price, price_rm, client, extra_col,
                     created_at, updated_at)
                SELECT
                    source_row_number, trade, category_item, equipment_type, sub_type, brand,
                    description, unit, copper_pipe_price, price_rm, client, extra_col,
                    NOW(), NOW()
                FROM (
                    SELECT DISTINCT
                        source_row_number, trade, category_item, equipment_type, sub_type,
                        brand, description, unit, copper_pipe_price, price_rm, client, extra_col
                    FROM staging_standard_rates_t
                ) AS src
                ON CONFLICT (trade, category_item, equipment_type, description, unit)
                DO UPDATE SET
                    sub_type = EXCLUDED.sub_type,
                    brand = EXCLUDED.brand,
                    copper_pipe_price = EXCLUDED.copper_pipe_price,
                    price_rm = EXCLUDED.price_rm,
                    client = EXCLUDED.client,
                    extra_col = EXCLUDED.extra_col,
                    updated_at = NOW()
                RETURNING xmax = 0 AS inserted_flag;
            """)

            rows = cur.fetchall()

            inserted = sum(1 for r in rows if r[0])
            updated = len(rows) - inserted

            overall_summary["inserted"] = inserted
            overall_summary["updated"] = updated

            raw_conn.commit()

        except Exception as e:
            raw_conn.rollback()
            current_app.logger.error("Bulk import failed", exc_info=True)
            overall_summary["errors"].append(str(e))
            raise

        finally:
            cur.close()
            raw_conn.close()

        return overall_summary


    # -------------------------------
    # CRUD helpers
    # -------------------------------
    @staticmethod
    def list_standard_rates(params):
        """
        params: dict containing optional keys:
            page, limit, trade, category_item, search
        """
        page = int(params.get("page", 1))
        limit = int(params.get("limit", 50))
        offset = (page - 1) * limit
        filters = []
        sql_params = {}

        if params.get("trade"):
            filters.append("trade ILIKE :trade")
            sql_params["trade"] = f"%{params['trade'].strip()}%"

        if params.get("category_item"):
            filters.append("category_item ILIKE  :category_item")
            sql_params["category_item"] = f"%{params['category_item'].strip()}%"

        if params.get("unit"):
            filters.append("unit ILIKE :unit")
            sql_params["unit"] = params["unit"].strip()
        if params.get("client"):
            filters.append("client ILIKE :client")
            sql_params["client"] = f"%{params['client'].strip()}%"


        where_clause = "WHERE " + " AND ".join(filters) if filters else ""

        search = params.get("search")
        if search:
            # add full-text search on description or ILIKE fallback
            where_clause = (where_clause + " AND " if where_clause else "WHERE ")
            where_clause += "(to_tsvector('english', coalesce(description, '')) @@ plainto_tsquery(:search) OR description ILIKE :like_search)"
            sql_params["search"] = search
            sql_params["like_search"] = f"%{search}%"

        # count total
        count_sql = f"SELECT COUNT(*) FROM standard_rates_t {where_clause}"
        total = db.session.execute(text(count_sql), sql_params).scalar()

        select_sql = f"""
        SELECT id, source_row_number, trade, category_item, equipment_type, sub_type, brand,
               description, unit, copper_pipe_price, price_rm, client, extra_col, created_at, updated_at
        FROM standard_rates_t
        {where_clause}
        ORDER BY trade, category_item, equipment_type
        LIMIT :limit OFFSET :offset
        """
        sql_params.update({"limit": limit, "offset": offset})
        rows = db.session.execute(text(select_sql), sql_params).fetchall()
        results = [dict(r._mapping) for r in rows]

        return {
            "page": page,
            "limit": limit,
            "total": int(total),
            "results": results
        }

    @staticmethod
    def add_standard_rate(payload):
        cols = ["trade", "category_item", "equipment_type", "sub_type", "brand",
                "description", "unit", "copper_pipe_price", "price_rm", "client", "extra_col", "source_row_number"]
        params = {k: payload.get(k) for k in cols}
        # numeric parsing
        params["copper_pipe_price"] = parse_numeric(params.get("copper_pipe_price"))
        params["price_rm"] = parse_numeric(params.get("price_rm"))
        insert_sql = text("""
        INSERT INTO standard_rates_t (source_row_number, trade, category_item, equipment_type, sub_type, brand, description, unit, copper_pipe_price, price_rm, client, extra_col, created_at, updated_at)
        VALUES (:source_row_number, :trade, :category_item, :equipment_type, :sub_type, :brand, :description, :unit, :copper_pipe_price, :price_rm, :client, :extra_col, NOW(), NOW())
        ON CONFLICT (trade, category_item, equipment_type, description, unit)
        DO UPDATE SET
            sub_type = COALESCE(EXCLUDED.sub_type, standard_rates_t.sub_type),
            brand = COALESCE(EXCLUDED.brand, standard_rates_t.brand),
            copper_pipe_price = COALESCE(EXCLUDED.copper_pipe_price, standard_rates_t.copper_pipe_price),
            price_rm = COALESCE(EXCLUDED.price_rm, standard_rates_t.price_rm),
            client = COALESCE(EXCLUDED.client, standard_rates_t.client),
            extra_col = COALESCE(EXCLUDED.extra_col, standard_rates_t.extra_col),
            updated_at = NOW()
        """)
        db.session.execute(insert_sql, params)
        db.session.commit()

    @staticmethod
    def update_standard_rate(rate_id, payload):
        params = {
            "id": rate_id,
            "trade": payload.get("trade"),
            "category_item": payload.get("category_item"),
            "equipment_type": payload.get("equipment_type"),
            "sub_type": payload.get("sub_type"),
            "brand": payload.get("brand"),
            "description": payload.get("description"),
            "unit": payload.get("unit"),
            "copper_pipe_price": parse_numeric(payload.get("copper_pipe_price")),
            "price_rm": parse_numeric(payload.get("price_rm")),
            "client": payload.get("client"),   # ✅ NEW FIELD ADDED
            "extra_col": payload.get("extra_col")
        }

        update_sql = text("""
            UPDATE standard_rates_t
            SET trade = :trade, 
                category_item = :category_item, 
                equipment_type = :equipment_type,
                sub_type = :sub_type, 
                brand = :brand, 
                description = :description, 
                unit = :unit,
                copper_pipe_price = :copper_pipe_price, 
                price_rm = :price_rm,
                client = :client,                -- ✅ NEW FIELD ADDED
                extra_col = :extra_col,
                updated_at = NOW()
            WHERE id = :id
        """)

        db.session.execute(update_sql, params)
        db.session.commit()


    @staticmethod
    def delete_standard_rate(rate_id):
        sql = text("DELETE FROM standard_rates_t WHERE id = :id")
        db.session.execute(sql, {"id": rate_id})
        db.session.commit()
