#!/bin/bash
# Скрипт для безопасной синхронизации templates/index.html с docs/index.html
# Автоматически заменяет Flask-синтаксис на относительные пути для GitHub Pages

set -e  # Остановка при ошибке

echo "🔄 Синхронизация templates/index.html → docs/index.html"

# Копируем файл
cp templates/index.html docs/index.html

# Заменяем Flask-синтаксис на относительные пути
echo "📝 Замена Flask-синтаксиса на относительные пути..."

# CSS путь
sed -i '' 's|{{ url_for('\''static'\'', filename='\''css/style.css'\'') }}|static/css/style.css|g' docs/index.html

# JS пути (общий паттерн для всех JS файлов)
sed -i '' 's|{{ url_for('\''static'\'', filename='\''js/\([^'\'']*\)'\'') }}|static/js/\1|g' docs/index.html

# Обновляем версию CSS (увеличиваем на 1)
CURRENT_VERSION=$(grep -o 'style.css?v=[0-9]*' docs/index.html | grep -o '[0-9]*' | head -1)
if [ -z "$CURRENT_VERSION" ]; then
    NEW_VERSION=1
else
    NEW_VERSION=$((CURRENT_VERSION + 1))
fi
sed -i '' "s|style.css?v=[0-9]*|style.css?v=$NEW_VERSION|g" docs/index.html

echo "✅ Версия CSS обновлена до v$NEW_VERSION"

# Проверяем, что Flask-синтаксис удален
if grep -q "url_for\|{{" docs/index.html; then
    echo "❌ ОШИБКА: В docs/index.html все еще есть Flask-синтаксис!"
    grep -n "url_for\|{{" docs/index.html
    exit 1
fi

# Проверяем, что пути корректны
if ! grep -q 'href="static/css/style.css' docs/index.html; then
    echo "❌ ОШИБКА: Путь к CSS некорректен!"
    exit 1
fi

if ! grep -q 'src="static/js/' docs/index.html; then
    echo "❌ ОШИБКА: Пути к JS некорректны!"
    exit 1
fi

echo "✅ Проверка пройдена: все пути корректны"
echo "✅ Синхронизация завершена успешно"

