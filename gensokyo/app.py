import os
import random
import string
import json
from flask import Flask, request, jsonify, render_template, abort

app = Flask(__name__)
# 共有データの保存ディレクトリ
SHARES_DIR = os.path.join(os.path.dirname(__file__), 'shares')

if not os.path.exists(SHARES_DIR):
    os.makedirs(SHARES_DIR)

def generate_id(length=8):
    """ランダムな共有IDを生成"""
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

@app.route('/')
def index():
    """メインページを表示"""
    return render_template('./gensokyo/index.html')

@app.route('/share/<share_id>')
def shared_page(share_id):
    """特定の共有ページを表示（OGP用にデータを読み込んで渡す）"""
    target = os.path.join(SHARES_DIR, f"{share_id}.json")
    if not os.path.exists(target):
        abort(404)
        
    with open(target, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # 生存率などを OGP 用に取り出す
    raw_plain = data.get('p', '')
    survival_info = "運命の境界を覗く……"
    if "生存率" in raw_plain:
        # 生存率の行を探す
        for line in raw_plain.split('\n'):
            if '生存率' in line:
                survival_info = line.strip()
                break

    ogp = {
        "title": f"幻想郷での運命: {data['d']['n']} の結果",
        "description": f"{survival_info} | {data['d']['n']}が「{data['d']['a']}」を試みた結果をみる。",
        "url": request.base_url
    }
    
    return render_template('./gensokyo/index.html', shared_id=share_id, ogp=ogp)

@app.route('/api/share', methods=['POST'])
def api_save_share():
    """データを保存して共有IDを返す"""
    data = request.json
    if not data:
        return jsonify({"error": "No data"}), 400
    
    share_id = generate_id()
    while os.path.exists(os.path.join(SHARES_DIR, f"{share_id}.json")):
        share_id = generate_id()
        
    with open(os.path.join(SHARES_DIR, f"{share_id}.json"), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    return jsonify({"share_id": share_id})

@app.route('/api/share/<share_id>', methods=['GET'])
def api_get_share(share_id):
    """保存された共有データを取得"""
    target = os.path.join(SHARES_DIR, f"{share_id}.json")
    if not os.path.exists(target):
        return jsonify({"error": "Not found"}), 404
        
    with open(target, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
