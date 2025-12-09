"""
Демонстрационный скрипт BTC Lottery
Показывает работу системы без веб-сервера
"""

import json
from lottery_core import get_lottery_result
from bitcoin_api import get_block_hashes_for_draw, get_latest_block_height


def demo_with_real_blocks():
    """Демонстрация с реальными блоками Bitcoin"""
    print("=" * 70)
    print("🎰 BTC LOTTERY - Демонстрация работы")
    print("=" * 70)
    print()
    
    # Загружаем билеты
    try:
        with open('tickets.json', 'r', encoding='utf-8') as f:
            tickets_data = json.load(f)
            tickets = tickets_data['tickets']
    except FileNotFoundError:
        tickets = [666, 77, 123, 1, 6, 1234, 34567, 126]
        print("⚠️  Файл tickets.json не найден, используем тестовые билеты")
    
    print(f"📋 Загружено билетов: {len(tickets)}")
    print(f"   Билеты: {', '.join(map(str, tickets))}")
    print()
    
    # Получаем информацию о последнем блоке
    print("⛓️  Получение блоков Bitcoin...")
    try:
        latest_height = get_latest_block_height()
        if latest_height:
            print(f"   Последний блок: #{latest_height}")
        
        # Получаем хеши блоков
        block_hashes = get_block_hashes_for_draw(count=3)
        print(f"   Получено блоков: {len(block_hashes)}")
        for i, hash_val in enumerate(block_hashes):
            print(f"   Блок {i+1}: {hash_val[:20]}...{hash_val[-10:]}")
        print()
        
    except Exception as e:
        print(f"❌ Ошибка при получении блоков: {e}")
        print("   Используем тестовые хеши блоков")
        block_hashes = [
            "00000000000000000002b3c9f4a910d6e4b5a6c7d8e9f00112233445566778899",
            "00000000000000000001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
            "00000000000000000003c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5"
        ]
    
    # Проводим розыгрыш
    print("🎲 Проведение розыгрыша...")
    print()
    
    result = get_lottery_result(block_hashes, tickets)
    
    # Выводим результаты
    print("=" * 70)
    print("📊 РЕЗУЛЬТАТЫ РОЗЫГРЫША")
    print("=" * 70)
    print()
    
    print("⛓️  Блоки Bitcoin:")
    for i, hash_val in enumerate(result['block_hashes']):
        print(f"   Блок {i+1}: {hash_val}")
    print()
    
    print("🎲 Seed (случайность):")
    print(f"   {result['seed_hex']}")
    print()
    
    print("🏆 ПОБЕДИТЕЛЬ:")
    print(f"   Билет №{result['winner']}")
    print(f"   Score: {result['scores'][result['winner']]}")
    print()
    
    print("📋 Все билеты и их score:")
    print()
    # Сортируем по score для наглядности
    sorted_tickets = sorted(
        result['scores'].items(),
        key=lambda x: int(x[1])
    )
    
    for ticket, score in sorted_tickets:
        marker = "🏆" if ticket == result['winner'] else "  "
        print(f"   {marker} Билет №{ticket:>6} → Score: {score}")
    print()
    
    print("=" * 70)
    print("🔍 ДАННЫЕ ДЛЯ ПРОВЕРКИ (JSON)")
    print("=" * 70)
    print()
    print(json.dumps(result['proof'], indent=2, ensure_ascii=False))
    print()
    
    print("=" * 70)
    print("✅ Розыгрыш завершён!")
    print("=" * 70)
    print()
    print("💡 Любой может проверить результат, используя:")
    print("   - seed_hex")
    print("   - список билетов")
    print("   - алгоритм: SHA256(seed + ':' + ticket_number)")
    print()


def demo_with_custom_data():
    """Демонстрация с пользовательскими данными"""
    print("\n" + "=" * 70)
    print("🎯 Демонстрация с пользовательскими данными")
    print("=" * 70)
    print()
    
    # Пользовательские данные
    custom_tickets = [1, 2, 3, 100, 200, 300]
    custom_block_hashes = [
        "0000000000000000000a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
        "0000000000000000000b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
        "0000000000000000000c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4"
    ]
    
    print(f"📋 Билеты: {custom_tickets}")
    print()
    
    result = get_lottery_result(custom_block_hashes, custom_tickets)
    
    print(f"🎲 Seed: {result['seed_hex']}")
    print(f"🏆 Победитель: билет №{result['winner']}")
    print()
    
    print("Все score:")
    for ticket, score in sorted(result['scores'].items(), key=lambda x: int(x[1])):
        marker = "🏆" if ticket == result['winner'] else "  "
        print(f"   {marker} Билет {ticket}: {score}")


if __name__ == "__main__":
    try:
        demo_with_real_blocks()
        demo_with_custom_data()
    except KeyboardInterrupt:
        print("\n\n⚠️  Прервано пользователем")
    except Exception as e:
        print(f"\n\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()

