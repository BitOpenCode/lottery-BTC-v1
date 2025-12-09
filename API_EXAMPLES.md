# 📡 Примеры использования API

## Базовый URL

```
http://localhost:5000
```

---

## 1. Провести розыгрыш

### Запрос

```bash
curl -X POST http://localhost:5000/api/lottery/draw \
  -H "Content-Type: application/json" \
  -d '{
    "block_count": 3
  }'
```

### С пользовательскими билетами

```bash
curl -X POST http://localhost:5000/api/lottery/draw \
  -H "Content-Type: application/json" \
  -d '{
    "block_count": 3,
    "tickets": [666, 77, 123, 1, 6, 1234]
  }'
```

### С указанием конкретного блока

```bash
curl -X POST http://localhost:5000/api/lottery/draw \
  -H "Content-Type: application/json" \
  -d '{
    "block_height": 800000,
    "block_count": 3
  }'
```

### Ответ

```json
{
  "success": true,
  "result": {
    "block_hashes": [
      "00000000000000000002b3c9f4a910d6e4b5a6c7d8e9f00112233445566778899",
      "00000000000000000001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
      "00000000000000000003c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5"
    ],
    "seed_hex": "a1b2c3d4e5f6...",
    "tickets": ["666", "77", "123", "1", "6", "1234"],
    "winner": "123",
    "scores": {
      "1": "12345678901234567890...",
      "6": "23456789012345678901...",
      "77": "34567890123456789012...",
      "123": "45678901234567890123...",
      "666": "56789012345678901234...",
      "1234": "67890123456789012345..."
    },
    "proof": {
      "seed_hex": "a1b2c3d4e5f6...",
      "tickets": ["666", "77", "123", "1", "6", "1234"],
      "scores": {...},
      "tie_breakers": {...},
      "winner": "123",
      "winner_score": "45678901234567890123...",
      "winner_tie_breaker": "78901234567890123456..."
    }
  }
}
```

---

## 2. Получить список билетов

### Запрос

```bash
curl http://localhost:5000/api/lottery/tickets
```

### Ответ

```json
{
  "success": true,
  "tickets": [666, 77, 123, 1, 6, 1234, 34567, 126],
  "count": 8
}
```

---

## 3. Проверить результат розыгрыша

### Запрос

```bash
curl -X POST http://localhost:5000/api/lottery/verify \
  -H "Content-Type: application/json" \
  -d '{
    "seed_hex": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    "tickets": ["666", "77", "123", "1", "6", "1234"],
    "claimed_winner": "123"
  }'
```

### Ответ

```json
{
  "success": true,
  "is_valid": true,
  "calculated_winner": "123",
  "claimed_winner": "123",
  "scores": {
    "1": "12345678901234567890...",
    "6": "23456789012345678901...",
    "77": "34567890123456789012...",
    "123": "45678901234567890123...",
    "666": "56789012345678901234...",
    "1234": "67890123456789012345..."
  },
  "proof": {
    "seed_hex": "a1b2c3d4e5f6...",
    "tickets": ["666", "77", "123", "1", "6", "1234"],
    "scores": {...},
    "winner": "123",
    "winner_score": "45678901234567890123..."
  }
}
```

---

## 4. Получить информацию о последнем блоке Bitcoin

### Запрос

```bash
curl http://localhost:5000/api/bitcoin/latest
```

### Ответ

```json
{
  "success": true,
  "latest_block_height": 850000
}
```

---

## Примеры на Python

### Провести розыгрыш

```python
import requests

response = requests.post(
    'http://localhost:5000/api/lottery/draw',
    json={'block_count': 3}
)

data = response.json()
if data['success']:
    winner = data['result']['winner']
    print(f"Победитель: билет №{winner}")
```

### Проверить результат

```python
import requests

response = requests.post(
    'http://localhost:5000/api/lottery/verify',
    json={
        'seed_hex': 'a1b2c3d4e5f6...',
        'tickets': ['666', '77', '123'],
        'claimed_winner': '123'
    }
)

data = response.json()
if data['success'] and data['is_valid']:
    print("✅ Результат проверен и подтверждён!")
```

---

## Примеры на JavaScript

### Провести розыгрыш

```javascript
fetch('http://localhost:5000/api/lottery/draw', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        block_count: 3
    })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        console.log('Победитель:', data.result.winner);
        console.log('Seed:', data.result.seed_hex);
    }
});
```

---

## Коды ошибок

- `200` - Успешный запрос
- `400` - Неверные параметры запроса
- `500` - Внутренняя ошибка сервера

### Пример ошибки

```json
{
  "success": false,
  "error": "Не удалось получить блоки Bitcoin"
}
```

