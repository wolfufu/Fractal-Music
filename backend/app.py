from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для всех доменов

@app.route('/generate', methods=['POST'])  # Явно указываем разрешенные методы
def generate():
    try:
        data = request.json
        print("Получены данные:", data)  # Для отладки
        
        # Здесь будет ваша логика генерации фрактала
        response_data = {
            "status": "success",
            "fractal_type": data.get('type'),
            "iterations": data.get('iterations'),
            "notes": [60, 62, 64, 65, 67]  # Пример данных
        }
        
        return jsonify(response_data), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(port=5000, debug=True)