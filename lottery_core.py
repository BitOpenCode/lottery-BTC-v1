"""
BTC Lottery Core - Ядро логики честной лотереи на основе Bitcoin блоков
"""

import hashlib
import json
from typing import List, Dict, Tuple, Optional, Union, Any


def sha256(data: bytes) -> bytes:
    """Вычисляет SHA256 хеш"""
    return hashlib.sha256(data).digest()


def generate_seed(block_hashes: List[str]) -> bytes:
    """
    Генерирует seed из хешей блоков Bitcoin
    
    Args:
        block_hashes: Список хешей блоков (например, [H_draw, H_draw-1, H_draw-2])
    
    Returns:
        bytes: 32-байтовый seed
    """
    # Конкатенируем все hashи блоков
    concatenated = ''.join(block_hashes).encode('utf-8')
    # Вычисляем SHA256
    return sha256(concatenated)


def normalize_ticket_number(ticket_number: Union[str, int]) -> str:
    """
    Нормализует номер билета (убирает ведущие нули)
    
    Args:
        ticket_number: Номер билета
    
    Returns:
        str: Нормализованный номер билета
    """
    return str(int(ticket_number))


def compute_score(seed_bytes: bytes, ticket_number: str) -> int:
    """
    Вычисляет score для конкретного билета
    
    Args:
        seed_bytes: Seed в виде байтов
        ticket_number: Номер билета (строка)
    
    Returns:
        int: Score билета (большое целое число)
    """
    payload = seed_bytes + b':' + ticket_number.encode('utf-8')
    hash_result = sha256(payload)
    return int.from_bytes(hash_result, 'big')


def tie_breaker(seed_bytes: bytes, ticket_number: str, index: int = 1) -> int:
    """
    Вычисляет tie-breaker для разрешения коллизий
    
    Args:
        seed_bytes: Seed в виде байтов
        ticket_number: Номер билета
        index: Индекс tie-breaker (1, 2, 3...)
    
    Returns:
        int: Tie-breaker score
    """
    payload = seed_bytes + b':' + ticket_number.encode('utf-8') + b':tb' + str(index).encode()
    hash_result = sha256(payload)
    return int.from_bytes(hash_result, 'big')


def pick_winner(seed_hex: str, tickets: List[Union[str, int]]) -> Tuple[str, Dict[str, int], Dict[str, Any]]:
    """
    Выбирает победителя лотереи
    
    Args:
        seed_hex: Seed в hex формате
        tickets: Список номеров билетов
    
    Returns:
        Tuple[str, Dict[str, int], Dict[str, any]]: 
            - Номер победившего билета
            - Словарь {номер_билета: score}
            - Полная информация для проверки
    """
    seed_bytes = bytes.fromhex(seed_hex)
    
    winner_ticket = None
    min_score = None
    min_tie_breaker = None
    scores = {}
    tie_breakers = {}
    
    for ticket in tickets:
        t_norm = normalize_ticket_number(ticket)
        score = compute_score(seed_bytes, t_norm)
        tb = tie_breaker(seed_bytes, t_norm, 1)
        
        scores[t_norm] = score
        tie_breakers[t_norm] = tb
        
        # Сравниваем (score, tie_breaker) как кортеж
        combined = (score, tb)
        
        if (min_score is None) or (combined < (min_score, min_tie_breaker)):
            min_score = score
            min_tie_breaker = tb
            winner_ticket = t_norm
    
    proof_data = {
        'seed_hex': seed_hex,
        'tickets': [normalize_ticket_number(t) for t in tickets],
        'scores': {k: str(v) for k, v in scores.items()},  # Преобразуем в stringsи для JSON
        'tie_breakers': {k: str(v) for k, v in tie_breakers.items()},
        'winner': winner_ticket,
        'winner_score': str(min_score),
        'winner_tie_breaker': str(min_tie_breaker)
    }
    
    return winner_ticket, scores, proof_data


def get_lottery_result(block_hashes: List[str], tickets: List[Union[str, int]], block_heights: Optional[List[int]] = None) -> Dict[str, Any]:
    """
    Получает полный результат лотереи
    
    Args:
        block_hashes: Список хешей блоков Bitcoin
        tickets: Список номеров билетов
        block_heights: Список высот блоков (опционально)
    
    Returns:
        Dict: Полная информация о розыгрыше
    """
    seed_bytes = generate_seed(block_hashes)
    seed_hex = seed_bytes.hex()
    
    winner, scores, proof_data = pick_winner(seed_hex, tickets)
    
    result = {
        'block_hashes': block_hashes,
        'block_heights': block_heights or [],
        'seed_hex': seed_hex,
        'tickets': [normalize_ticket_number(t) for t in tickets],
        'winner': winner,
        'scores': {k: str(v) for k, v in scores.items()},
        'proof': proof_data
    }
    
    return result


if __name__ == "__main__":
    # Example использования
    tickets = [666, 77, 123, 1, 6, 1234, 34567, 126]
    
    # Exampleные hashи блоков (в реальности берутся из Bitcoin API)
    block_hashes = [
        "00000000000000000002b3c9f4a910d6e4b5a6c7d8e9f00112233445566778899",
        "00000000000000000001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
        "00000000000000000003c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5"
    ]
    
    result = get_lottery_result(block_hashes, tickets)
    
    print("🎉 Результаты лотереи:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print(f"\n🏆 Победитель: билет №{result['winner']}")

