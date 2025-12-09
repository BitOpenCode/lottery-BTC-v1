"""
Flask API для BTC Lottery
"""

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import json
from lottery_core import get_lottery_result, generate_seed, pick_winner
from bitcoin_api import get_block_hashes_for_draw, get_latest_block_height
from typing import List

app = Flask(__name__)
CORS(app)

# Загружаем билеты из файла или используем по умолчанию
DEFAULT_TICKETS = [666, 77, 123, 1, 6, 1234, 34567, 126, 999, 42, 777, 888, 555, 333, 111]


def load_tickets() -> List[int]:
    """Загружает список билетов из файла или возвращает дефолтный"""
    try:
        with open('tickets.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('tickets', DEFAULT_TICKETS)
    except FileNotFoundError:
        return DEFAULT_TICKETS


def save_tickets(tickets: List[int]) -> bool:
    """Сохраняет список билетов в файл"""
    try:
        with open('tickets.json', 'w', encoding='utf-8') as f:
            json.dump({'tickets': tickets}, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Ошибка при сохранении билетов: {e}")
        return False


@app.route('/')
def index():
    """Главная страница"""
    return render_template('index.html')


@app.route('/api/lottery/draw', methods=['POST'])
def lottery_draw():
    """
    Проводит розыгрыш лотереи
    
    Body (JSON):
    {
        "block_height": int (опционально, по умолчанию последний блок),
        "block_count": int (опционально, по умолчанию 3),
        "tickets": [int] (опционально, по умолчанию из файла)
    }
    """
    try:
        data = request.get_json() or {}
        
        # Получаем параметры
        block_height = data.get('block_height')
        block_count = data.get('block_count', 3)
        tickets = data.get('tickets')
        
        if tickets is None:
            tickets = load_tickets()
        
        # Получаем хеши блоков
        block_hashes = get_block_hashes_for_draw(block_height, block_count)
        
        # Проводим розыгрыш
        result = get_lottery_result(block_hashes, tickets)
        
        return jsonify({
            'success': True,
            'result': result
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/lottery/tickets', methods=['GET'])
def get_tickets():
    """Возвращает список всех билетов"""
    tickets = load_tickets()
    return jsonify({
        'success': True,
        'tickets': tickets,
        'count': len(tickets)
    })


@app.route('/api/lottery/tickets/add', methods=['POST'])
def add_ticket():
    """Добавляет новый билет"""
    try:
        data = request.get_json()
        ticket_number = data.get('ticket_number')
        
        if ticket_number is None:
            return jsonify({
                'success': False,
                'error': 'Не указан номер билета'
            }), 400
        
        # Преобразуем в число для нормализации
        try:
            ticket_number = int(ticket_number)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Номер билета должен быть числом'
            }), 400
        
        tickets = load_tickets()
        
        # Проверяем, не существует ли уже такой билет
        if ticket_number in tickets:
            return jsonify({
                'success': False,
                'error': f'Билет №{ticket_number} уже существует'
            }), 400
        
        tickets.append(ticket_number)
        tickets.sort()  # Сортируем для удобства
        
        if save_tickets(tickets):
            return jsonify({
                'success': True,
                'tickets': tickets,
                'count': len(tickets),
                'message': f'Билет №{ticket_number} успешно добавлен'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Ошибка при сохранении билетов'
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/lottery/tickets/remove', methods=['POST'])
def remove_ticket():
    """Удаляет билет"""
    try:
        data = request.get_json()
        ticket_number = data.get('ticket_number')
        
        if ticket_number is None:
            return jsonify({
                'success': False,
                'error': 'Не указан номер билета'
            }), 400
        
        try:
            ticket_number = int(ticket_number)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Номер билета должен быть числом'
            }), 400
        
        tickets = load_tickets()
        
        if ticket_number not in tickets:
            return jsonify({
                'success': False,
                'error': f'Билет №{ticket_number} не найден'
            }), 404
        
        tickets.remove(ticket_number)
        
        if save_tickets(tickets):
            return jsonify({
                'success': True,
                'tickets': tickets,
                'count': len(tickets),
                'message': f'Билет №{ticket_number} успешно удалён'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Ошибка при сохранении билетов'
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/lottery/tickets/update', methods=['POST'])
def update_tickets():
    """Обновляет весь список билетов"""
    try:
        data = request.get_json()
        tickets = data.get('tickets')
        
        if tickets is None:
            return jsonify({
                'success': False,
                'error': 'Не указан список билетов'
            }), 400
        
        # Валидация и нормализация
        try:
            tickets = [int(t) for t in tickets]
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Все номера билетов должны быть числами'
            }), 400
        
        # Удаляем дубликаты
        tickets = list(set(tickets))
        tickets.sort()
        
        if save_tickets(tickets):
            return jsonify({
                'success': True,
                'tickets': tickets,
                'count': len(tickets),
                'message': f'Список билетов успешно обновлён ({len(tickets)} билетов)'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Ошибка при сохранении билетов'
            }), 500
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/lottery/verify', methods=['POST'])
def verify_result():
    """
    Проверяет результат розыгрыша
    
    Body (JSON):
    {
        "seed_hex": str,
        "tickets": [int],
        "claimed_winner": str
    }
    """
    try:
        data = request.get_json()
        seed_hex = data.get('seed_hex')
        tickets = data.get('tickets')
        claimed_winner = data.get('claimed_winner')
        
        if not all([seed_hex, tickets, claimed_winner]):
            return jsonify({
                'success': False,
                'error': 'Недостаточно данных для проверки'
            }), 400
        
        # Пересчитываем победителя
        winner, scores, proof_data = pick_winner(seed_hex, tickets)
        
        is_valid = (winner == claimed_winner)
        
        return jsonify({
            'success': True,
            'is_valid': is_valid,
            'calculated_winner': winner,
            'claimed_winner': claimed_winner,
            'scores': {k: str(v) for k, v in scores.items()},
            'proof': proof_data
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/bitcoin/latest', methods=['GET'])
def get_latest_block():
    """Возвращает информацию о последнем блоке Bitcoin"""
    try:
        height = get_latest_block_height()
        if height is None:
            raise Exception("Не удалось получить высоту блока")
        
        return jsonify({
            'success': True,
            'latest_block_height': height
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)

