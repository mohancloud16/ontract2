from app import create_app

app = create_app(include_admin=True)

@app.route("/")
def home():
    return {"message": "Admin service is running"}

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
