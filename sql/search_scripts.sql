-- Получение всех сохраненных композиций пользователя
SELECT * FROM compositions WHERE user_id = 1;

-- Получение избранных композиций пользователя с дополнительной информацией
SELECT c.* 
FROM compositions c
JOIN favorites f ON c.composition_id = f.composition_id
WHERE f.user_id = 1
ORDER BY f.added_at DESC;