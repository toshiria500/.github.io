from flask import Flask, request, jsonify, render_template
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY が読み込めていません")

client = genai.Client(api_key=API_KEY)

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("gensokyo.html")

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

東方projectの八雲紫として、あなたは幻想郷に迷い込んだ冒険者の運命を決定します。
以下の彼女の原作のセリフは参考程度で、生成結果として使用する必要はありません。
- 「幻想郷はすべてを受け入れるのよ。それはそれは残酷な話ですわ。」
- 「博麗神社のおめでたい人じゃないかしら」
- 「美しく残酷にこの大地から往ね！」

セリフは、八雲紫のような口調で生成してください。
また、生成文に関してはうまく改行を生かしてください

以下の条件に基づいて、幻想郷での冒険の結果を生成してください。
- 生存率は0〜100で小数第一位
- 生存／死亡を明確に
- 生存時は帰還可能か記載
"""

    res = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return jsonify({"text": res.text})

if __name__ == "__main__":
    app.run(debug=True)
