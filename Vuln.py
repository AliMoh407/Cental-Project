import sqlite3
from flask import Flask, request

app = Flask(__name__)

# Hard-coded secret (bad practice)
API_SECRET = "mysecret123"

# In-memory database for demo
def get_db():
    conn = sqlite3.connect("users.db")
    return conn

@app.route("/login", methods=["GET"])
def login():
    username = request.args.get("username")
    password = request.args.get("password")

    # Vulnerable: SQL Injection
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    conn = get_db()
    cursor = conn.cursor()
    result = cursor.execute(query).fetchone()

    if result:
        return f"Welcome {username}! (Debug info: {result})"  # Information disclosure
    else:
        return "Invalid credentials"

if __name__ == "__main__":
    # Debug mode enabled (security risk)
    app.run(debug=True)
