from flask import Flask, render_template, request, redirect, jsonify, session, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import psycopg2
import uuid
from datetime import datetime, timedelta
import json

app = Flask(__name__, static_folder="static")
app.secret_key = "my_secret_key"
CORS(app, supports_credentials=True)

app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

conn = psycopg2.connect(
    dbname="fractune",
    user="postgres",
    password="12345",
    host="localhost",
    port="5432"
)

@app.route("/")
def index():
    if "session_id" not in session:
        return redirect("/login")
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        data = request.form
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO users (username, email, password_hash)
                VALUES (%s, %s, %s)
                RETURNING user_id
            """, (data['username'], data['email'], generate_password_hash(data['password'])))
            user_id = cur.fetchone()[0]
            conn.commit()
            return redirect("/login")
    return render_template("register.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.form
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, password_hash FROM users WHERE email = %s", (data["email"],))
            user = cur.fetchone()
            if user and check_password_hash(user[1], data["password"]):
                user_id = user[0]
                session_id = str(uuid.uuid4())
                expires = datetime.utcnow() + timedelta(days=7)
                cur.execute("""
                    INSERT INTO user_sessions (session_id, user_id, expires_at, ip_address)
                    VALUES (%s, %s, %s, %s)
                """, (session_id, user_id, expires, request.remote_addr))
                session["session_id"] = session_id
                conn.commit()
                return redirect("/")
        return render_template("login.html", error="Неверный email или пароль")
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("session_id", None)
    return redirect("/login")

@app.route("/save_composition", methods=["POST"])
def save_composition():
    if "session_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    with conn.cursor() as cur:
        # Проверяем, что сессия существует и не истекла
        cur.execute("""
            SELECT user_id FROM user_sessions 
            WHERE session_id = %s AND expires_at > NOW()
        """, (session["session_id"],))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Invalid or expired session"}), 403

        user_id = result[0]
        data = request.get_json()
        
        try:
            # Проверяем, что данные корректны
            if not all(key in data for key in ["title", "melody", "bass", "drums"]):
                return jsonify({"error": "Invalid data format"}), 400
                
            cur.execute("""
                INSERT INTO compositions (user_id, title, melody_data, bass_data, drums_data)
                VALUES (%s, %s, %s, %s, %s) RETURNING composition_id
            """, (user_id, data["title"], 
                 json.dumps(data["melody"]), 
                 json.dumps(data["bass"]), 
                 json.dumps(data["drums"])))
            composition_id = cur.fetchone()[0]

            cur.execute("""
                INSERT INTO user_history (user_id, action_type, action_data)
                VALUES (%s, 'composition_created', %s)
            """, (user_id, json.dumps({"composition_id": composition_id, "title": data["title"]})))
            
            conn.commit()
            return jsonify({"composition_id": composition_id})
            
        except (psycopg2.Error, KeyError, json.JSONDecodeError) as e:
            conn.rollback()
            return jsonify({"error": str(e)}), 400

@app.route("/add_favorite", methods=["POST"])
def add_favorite():
    if "session_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM user_sessions WHERE session_id = %s", (session["session_id"],))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Invalid session"}), 403
        user_id = result[0]
        cur.execute("""
            INSERT INTO favorites (user_id, composition_id) 
            VALUES (%s, %s) ON CONFLICT DO NOTHING
        """, (user_id, data["composition_id"]))

        cur.execute("""
            INSERT INTO user_history (user_id, action_type, action_data)
            VALUES (%s, 'favorite_added', %s)
        """, (user_id, json.dumps({"composition_id": data["composition_id"]})))

        conn.commit()
        return jsonify({"success": True})
    
@app.route("/delete_composition/<int:composition_id>", methods=["DELETE"])
def delete_composition(composition_id):
    if "session_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403
    try:
        with conn.cursor() as cur:
            # Проверяем, что сессия действительна
            cur.execute("""
                SELECT user_id FROM user_sessions 
                WHERE session_id = %s AND expires_at > NOW()
            """, (session["session_id"],))
            result = cur.fetchone()
            if not result:
                return jsonify({"error": "Invalid or expired session"}), 403

            user_id = result[0]
            
            # Сначала проверяем существование композиции
            cur.execute("""
                SELECT composition_id FROM compositions 
                WHERE composition_id = %s AND user_id = %s
            """, (composition_id, user_id))
            composition = cur.fetchone()
            
            if not composition:
                return jsonify({"error": "Composition not found or access denied"}), 404
            
            # Удаляем из избранного (если есть)
            cur.execute("""
                DELETE FROM favorites 
                WHERE composition_id = %s
            """, (composition_id,))
            
            # Удаляем саму композицию
            cur.execute("""
                DELETE FROM compositions 
                WHERE composition_id = %s
            """, (composition_id,))
            
            # Добавляем в историю
            cur.execute("""
                INSERT INTO user_history (user_id, action_type, action_data)
                VALUES (%s, 'composition_deleted', %s)
            """, (user_id, json.dumps({"composition_id": composition_id})))
            
            conn.commit()  # Явное подтверждение изменений
            return jsonify({"success": True})
        
    except Exception as e:
        conn.rollback()  # Откат при ошибке
        return jsonify({"error": str(e)}), 500

    
@app.route("/add_favorite", methods=["DELETE"])
def remove_favorite():
    if "session_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM user_sessions WHERE session_id = %s", (session["session_id"],))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Invalid session"}), 403
        user_id = result[0]
        
        cur.execute("""
            DELETE FROM favorites 
            WHERE user_id = %s AND composition_id = %s
        """, (user_id, data["composition_id"]))
        
        cur.execute("""
            INSERT INTO user_history (user_id, action_type, action_data)
            VALUES (%s, 'favorite_removed', %s)
        """, (user_id, json.dumps({"composition_id": data["composition_id"]})))
        
        conn.commit()
        return jsonify({"success": True})

@app.route("/favorites")
def get_favorites():
    if "session_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM user_sessions WHERE session_id = %s", (session["session_id"],))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Invalid session"}), 403

        user_id = result[0]
        cur.execute("""
            SELECT c.composition_id, c.title, c.creation_date
            FROM favorites f
            JOIN compositions c ON f.composition_id = c.composition_id
            WHERE f.user_id = %s
            ORDER BY f.added_at DESC
        """, (user_id,))
        favorites = cur.fetchall()

        return jsonify([
            {"composition_id": row[0], "title": row[1], "created": row[2].isoformat()} for row in favorites
        ])
    
@app.route("/get_composition/<int:composition_id>")
def get_composition(composition_id):
    if "session_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    with conn.cursor() as cur:
        # Проверяем, что сессия действительна
        cur.execute("SELECT user_id FROM user_sessions WHERE session_id = %s AND expires_at > NOW()", 
                   (session["session_id"],))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Invalid or expired session"}), 403

        user_id = result[0]
        
        # Проверяем, что композиция принадлежит пользователю
        cur.execute("""
            SELECT title, melody_data, bass_data, drums_data 
            FROM compositions 
            WHERE composition_id = %s AND user_id = %s
        """, (composition_id, user_id))
        composition = cur.fetchone()
        
        if not composition:
            return jsonify({"error": "Composition not found or access denied"}), 404
        
        return jsonify({
                "title": composition[0],
                "melody": composition[1],
                "bass": composition[2],
                "drums": composition[3]
            })

@app.route("/history")
def get_history():
    if "session_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM user_sessions WHERE session_id = %s", (session["session_id"],))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Invalid session"}), 403
        
        user_id = result[0]
        
        # Получаем ТОЛЬКО существующие композиции
        cur.execute("""
            SELECT 
                'composition_created' as action_type,
                creation_date as action_time,
                json_build_object(
                    'composition_id', composition_id,
                    'title', title
                ) as action_data
            FROM compositions
            WHERE user_id = %s
            ORDER BY creation_date DESC
            LIMIT 50
        """, (user_id,))
        
        history = cur.fetchall()
        return jsonify([{
            "type": row[0],
            "time": row[1].isoformat(),
            "data": row[2]
        } for row in history])
    
@app.route("/my_compositions")
def get_my_compositions():
    if "session_id" not in session:
        return jsonify({"error": "Unauthorized"}), 403

    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM user_sessions WHERE session_id = %s", (session["session_id"],))
        result = cur.fetchone()
        if not result:
            return jsonify({"error": "Invalid session"}), 403
        
        user_id = result[0]
        
        cur.execute("""
            SELECT composition_id, title, creation_date 
            FROM compositions 
            WHERE user_id = %s
            ORDER BY creation_date DESC
        """, (user_id,))
        
        return jsonify([{
            "composition_id": row[0],
            "title": row[1],
            "created": row[2].isoformat()
        } for row in cur.fetchall()])

@app.route("/check_auth")
def check_auth():
    if "session_id" not in session:
        return jsonify({"authenticated": False})
    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM user_sessions WHERE session_id = %s", (session["session_id"],))
        user = cur.fetchone()
        return jsonify({"authenticated": bool(user)})

if __name__ == "__main__":
    app.run(debug=True)
