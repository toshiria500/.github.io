from flask import Flask, request, jsonify, render_template
import os

# Google Gemini Client は必要に応じて import
# from google import genai

# APIキーは環境変数から取得
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY が読み込めていません")

# client = genai.Client(api_key=API_KEY)

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/gensokyo", methods=["POST"])
def gensokyo():
    data = request.json
    name = data.get("name", "")
    action = data.get("action", "")
    item = data.get("item", "")
    companion = data.get("companion", "")
    enemy = data.get("enemy", "なし")

    prompt = f"""
あなたの名前: {name}
あなたの行動: {action}
あなたの持ち物: {item}
あなたのお供: {companion}
あなたの敵: {enemy}

幻想郷での冒険を八雲紫風の口調で生成してください。
生存率、帰還可能かなども明示してください。
"""

    # Gemini で生成（ダミーで戻す場合）
    # res = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
    # return jsonify({"text": res.text})

    # デバッグ用ダミー
    return jsonify({"text": f"{name}の冒険結果です。\n{action}をしました。生存率は95.0%。帰還可能です。"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)