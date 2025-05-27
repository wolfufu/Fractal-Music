-- Регистрация нового пользователя
INSERT INTO users (username, email, password_hash) 
VALUES ('new_user', 'user@example.com', 'hashed_password_here') 
RETURNING user_id;

-- Создание новой сессии
INSERT INTO user_sessions (user_id, expires_at, ip_address)
VALUES (1, NOW() + INTERVAL '7 days', '192.168.1.1');

-- Сохранение новой композиции
INSERT INTO compositions (user_id, title, melody_data, bass_data, drums_data)
VALUES (
  1, 
  'Моя первая фрактальная мелодия',
  '{"type": "tree", "depth": 3, "rules": {"angle": 45, "lengthFactor": 0.67}}',
  '{"type": "dragon", "depth": 4, "rules": {"color": "#feca57"}}',
  '{"type": "barnsley", "depth": 3, "rules": {"points": 10000}}'
) RETURNING composition_id;

-- Добавление композиции в избранное
INSERT INTO favorites (user_id, composition_id)
VALUES (1, 1);

-- Запись действия в историю
INSERT INTO user_history (user_id, action_type, action_data)
VALUES (
  1,
  'composition_created',
  '{"composition_id": 1, "title": "Моя первая фрактальная мелодия"}'
)

