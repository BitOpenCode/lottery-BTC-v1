"""
Bitcoin API - Получение реальных хешей блоков Bitcoin
"""

import requests
from typing import List, Optional


def get_block_hash_by_height(height: int) -> Optional[str]:
    """
    Получает хеш блока по его высоте через публичный API
    
    Args:
        height: Высота блока
    
    Returns:
        str: Хеш блока или None при ошибке
    """
    try:
        # Используем публичный API Blockstream
        url = f"https://blockstream.info/api/block-height/{height}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.text.strip()
    except Exception as e:
        print(f"Ошибка при получении блока {height}: {e}")
    
    return None


def get_latest_block_hash() -> Optional[str]:
    """
    Получает хеш последнего блока Bitcoin
    
    Returns:
        str: Хеш последнего блока или None при ошибке
    """
    try:
        url = "https://blockstream.info/api/blocks/tip/hash"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return response.text.strip()
    except Exception as e:
        print(f"Ошибка при получении последнего блока: {e}")
    
    return None


def get_latest_block_height() -> Optional[int]:
    """
    Получает высоту последнего блока Bitcoin
    
    Returns:
        int: Высота блока или None при ошибке
    """
    try:
        url = "https://blockstream.info/api/blocks/tip/height"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            return int(response.text.strip())
    except Exception as e:
        print(f"Ошибка при получении высоты блока: {e}")
    
    return None


def get_block_hashes_for_draw(draw_block_height: Optional[int] = None, count: int = 3) -> List[str]:
    """
    Получает хеши блоков для розыгрыша
    
    Args:
        draw_block_height: Высота блока для розыгрыша (если None - последний блок)
        count: Количество блоков для использования (по умолчанию 3)
    
    Returns:
        List[str]: Список хешей блоков
    """
    if draw_block_height is None:
        draw_block_height = get_latest_block_height()
        if draw_block_height is None:
            raise Exception("Не удалось получить высоту последнего блока")
    
    block_hashes = []
    for i in range(count):
        height = draw_block_height - i
        block_hash = get_block_hash_by_height(height)
        if block_hash:
            block_hashes.append(block_hash)
        else:
            raise Exception(f"Не удалось получить блок {height}")
    
    return block_hashes


if __name__ == "__main__":
    # Тест получения блоков
    print("Получение последних блоков Bitcoin...")
    try:
        hashes = get_block_hashes_for_draw(count=3)
        print(f"Получено {len(hashes)} блоков:")
        for i, h in enumerate(hashes):
            print(f"  Блок {i+1}: {h}")
    except Exception as e:
        print(f"Ошибка: {e}")

