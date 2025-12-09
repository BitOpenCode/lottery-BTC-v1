// BTC Lottery Frontend JavaScript

// Настройка API базового URL
// Оставляем пустым - используем клиентскую логику (работает без бэкенда!)
const API_BASE = '';

let currentResult = null;
let currentTickets = []; // Билеты в памяти браузера

// Инициализация Telegram WebApp API
let tg = null;
if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
}

// Обновление главной кнопки Telegram
function updateTelegramMainButton() {
    if (!tg || !tg.MainButton) return;
    
    if (currentTickets.length > 0) {
        tg.MainButton.setText(`🎲 Провести розыгрыш (${currentTickets.length})`);
        tg.MainButton.onClick(() => {
            document.getElementById('drawBtn').click();
        });
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('drawBtn').addEventListener('click', conductDraw);
    document.getElementById('showAllScores').addEventListener('change', toggleScores);
    document.getElementById('copyProofBtn').addEventListener('click', copyProof);
    
    // Ввод билетов по одному
    document.getElementById('addSingleTicketBtn').addEventListener('click', addSingleTicket);
    document.getElementById('singleTicketInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addSingleTicket();
    });
    
    // Массовый ввод
    document.getElementById('parseBulkTicketsBtn').addEventListener('click', parseBulkTickets);
    
    // Переключение методов ввода
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchInputMethod(btn.dataset.method));
    });
    
    // Очистка всех билетов
    document.getElementById('clearAllCurrentBtn').addEventListener('click', clearAllCurrentTickets);
    
    // Показать процесс генерации seed
    const showSeedBtn = document.getElementById('showSeedGenerationBtn');
    if (showSeedBtn) {
        showSeedBtn.addEventListener('click', toggleSeedGeneration);
    }
    
    // Показать процесс выбора победителя
    const showWinnerBtn = document.getElementById('showWinnerSelectionBtn');
    if (showWinnerBtn) {
        showWinnerBtn.addEventListener('click', toggleWinnerSelection);
    }
    
    // Обновляем кнопку розыгрыша при изменении билетов
    updateDrawButton();
});

// Проведение розыгрыша
async function conductDraw() {
    if (currentTickets.length === 0) {
        showError('Добавьте хотя бы один билет перед проведением розыгрыша');
        return;
    }
    
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results');
    const errorEl = document.getElementById('error');
    
    loadingEl.classList.remove('hidden');
    resultsEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    
    try {
        // Проверяем, загружена ли клиентская логика
        if (typeof conductLotteryDraw === 'undefined') {
            throw new Error('Клиентская логика не загружена. Убедитесь, что файл lottery-client.js подключен.');
        }
        
        // Используем клиентскую логику (работает без бэкенда!)
        const result = await conductLotteryDraw(currentTickets, 3);
        
        currentResult = result;
        displayResults(result);
        
        showSuccess('Розыгрыш успешно проведен!');
    } catch (error) {
        console.error('Ошибка при проведении розыгрыша:', error);
        showError('Ошибка: ' + error.message);
    } finally {
        loadingEl.classList.add('hidden');
    }
}

// Добавление билета по одному
function addSingleTicket() {
    const input = document.getElementById('singleTicketInput');
    const ticketNumber = input.value.trim();
    
    if (!ticketNumber) {
        showError('Введите номер билета');
        return;
    }
    
    const num = parseInt(ticketNumber);
    if (isNaN(num)) {
        showError('Номер билета должен быть числом');
        return;
    }
    
    if (currentTickets.includes(num)) {
        showError(`Билет №${num} уже добавлен`);
        return;
    }
    
    currentTickets.push(num);
    currentTickets.sort((a, b) => a - b);
    
    input.value = '';
    updateTicketsDisplay();
    updateDrawButton();
    showSuccess(`Билет №${num} добавлен`);
}

// Разбор массового ввода
function parseBulkTickets() {
    const textarea = document.getElementById('bulkTicketsInput');
    const text = textarea.value.trim();
    
    if (!text) {
        showError('Введите номера билетов');
        return;
    }
    
    // Парсим текст: разделяем по запятым или переносам строк
    const tickets = text
        .split(/[,\n\r]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => {
            // Удаляем все нецифровые символы кроме минуса в начале
            const cleaned = t.replace(/[^\d-]/g, '');
            return cleaned ? parseInt(cleaned) : null;
        })
        .filter(t => t !== null && !isNaN(t));
    
    if (tickets.length === 0) {
        showError('Не найдено валидных номеров билетов');
        return;
    }
    
    // Добавляем только новые билеты
    const newTickets = tickets.filter(t => !currentTickets.includes(t));
    const duplicates = tickets.filter(t => currentTickets.includes(t));
    
    currentTickets = [...new Set([...currentTickets, ...tickets])];
    currentTickets.sort((a, b) => a - b);
    
    textarea.value = '';
    updateTicketsDisplay();
    updateDrawButton();
    
    if (duplicates.length > 0) {
        showSuccess(`Добавлено ${newTickets.length} новых билетов. ${duplicates.length} билетов уже были в списке.`);
    } else {
        showSuccess(`Добавлено ${tickets.length} билетов`);
    }
}

// Переключение метода ввода
function switchInputMethod(method) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.input-method').forEach(methodEl => {
        methodEl.classList.remove('active');
    });
    
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    document.getElementById(`${method}InputMethod`).classList.add('active');
}

// Обновление отображения билетов
function updateTicketsDisplay() {
    const countEl = document.getElementById('currentTicketsCount');
    const displayEl = document.getElementById('currentTicketsDisplay');
    
    countEl.textContent = currentTickets.length;
    
    if (currentTickets.length === 0) {
        displayEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Нет билетов. Добавьте билеты для проведения розыгрыша.</p>';
        return;
    }
    
    displayEl.innerHTML = currentTickets.map(ticket => `
        <div class="current-ticket-item">
            Билет №${ticket}
        </div>
    `).join('');
}

// Очистка всех билетов
function clearAllCurrentTickets() {
    if (currentTickets.length === 0) {
        return;
    }
    
    if (!confirm(`Удалить все ${currentTickets.length} билетов?`)) {
        return;
    }
    
    currentTickets = [];
    updateTicketsDisplay();
    updateDrawButton();
    showSuccess('Все билеты удалены');
}

// Обновление состояния кнопки розыгрыша
function updateDrawButton() {
    const drawBtn = document.getElementById('drawBtn');
    if (currentTickets.length > 0) {
        drawBtn.disabled = false;
        drawBtn.textContent = `🎲 Провести розыгрыш (${currentTickets.length})`;
    } else {
        drawBtn.disabled = true;
        drawBtn.textContent = '🎲 Провести розыгрыш';
    }
    updateTelegramMainButton();
}

// Загрузка списка билетов
async function loadTickets() {
    try {
        const response = await fetch(`${API_BASE}/api/lottery/tickets`);
        const data = await response.json();
        
        if (data.success) {
            alert(`Загружено билетов: ${data.count}\n\nБилеты: ${data.tickets.join(', ')}`);
        }
    } catch (error) {
        showError('Ошибка при загрузке билетов: ' + error.message);
    }
}

// Отображение результатов
function displayResults(result) {
    const resultsEl = document.getElementById('results');
    resultsEl.classList.remove('hidden');
    
    // Блоки Bitcoin
    displayBlockHashes(result.block_hashes, result.block_heights);
    
    // Seed
    displaySeed(result.seed_hex);
    
    // Процесс генерации seed (скрыт по умолчанию)
    if (result.block_hashes) {
        displaySeedGeneration(result.block_hashes, result.seed_hex);
    }
    
    // Победитель
    displayWinner(result.winner, result.scores[result.winner]);
    
    // Билеты
    displayTickets(result.tickets, result.scores, result.winner);
    displayWinnerSelection(result.tickets, result.scores, result.winner);
    
    // Proof данные
    displayProof(result.proof);
    
    // Визуальная схема
    updateVisualFlow(result);
}

// Отображение хешей блоков
function displayBlockHashes(hashes, heights) {
    const container = document.getElementById('blockHashes');
    container.innerHTML = hashes.map((hash, index) => {
        const height = heights && heights[index] ? heights[index] : null;
        const heightLabel = height ? `Блок #${height}` : `Блок ${index + 1}`;
        
        // Ссылки на блокчейн-эксплореры
        const blockstreamLink = height 
            ? `https://blockstream.info/block-height/${height}`
            : `https://blockstream.info/block/${hash}`;
        const blockchainLink = height
            ? `https://www.blockchain.com/btc/block-height/${height}`
            : `https://www.blockchain.com/btc/block/${hash}`;
        
        return `<div class="block-hash-item">
            <div class="block-header">
                <strong>${heightLabel}:</strong>
                <div class="block-links">
                    <a href="${blockstreamLink}" target="_blank" rel="noopener noreferrer" class="block-link">
                        🔍 Blockstream
                    </a>
                    <a href="${blockchainLink}" target="_blank" rel="noopener noreferrer" class="block-link">
                        🔗 Blockchain.com
                    </a>
                </div>
            </div>
            <div class="block-hash-value">${hash}</div>
        </div>`;
    }).join('');
}

// Отображение seed
function displaySeed(seedHex) {
    const container = document.getElementById('seedDisplay');
    container.textContent = seedHex;
}

// Отображение процесса генерации seed
function displaySeedGeneration(blockHashes, seedHex) {
    const processEl = document.getElementById('seedGenerationProcess');
    
    // Шаг 1: Конкатенация блоков
    const concatenated = blockHashes.join('');
    document.getElementById('concatenatedBlocks').innerHTML = `
        <div style="margin-bottom: 4px;">Блок 1: ${blockHashes[0].substring(0, 20)}...</div>
        <div style="margin-bottom: 4px;">+ Блок 2: ${blockHashes[1] ? blockHashes[1].substring(0, 20) + '...' : ''}</div>
        <div style="margin-bottom: 4px;">+ Блок 3: ${blockHashes[2] ? blockHashes[2].substring(0, 20) + '...' : ''}</div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
            <strong>Результат:</strong> ${concatenated.length} символов
        </div>
    `;
    
    // Шаг 2: Преобразование в байты
    const bytesLength = concatenated.length; // Каждый hex символ = 1 байт в UTF-8
    document.getElementById('bytesInfo').innerHTML = `
        <div>Строка: ${concatenated.length} hex символов</div>
        <div>→ Преобразование через UTF-8</div>
        <div style="margin-top: 4px;"><strong>Результат:</strong> ${bytesLength} байт</div>
    `;
    
    // Шаг 3: SHA256
    document.getElementById('sha256Info').innerHTML = `
        <div>SHA256(${bytesLength} байт)</div>
        <div style="margin-top: 4px;">→ Алгоритм SHA256 обрабатывает данные</div>
        <div style="margin-top: 4px;"><strong>Результат:</strong> 32 байта (256 бит)</div>
    `;
    
    // Шаг 4: Финальный seed
    document.getElementById('finalSeed').innerHTML = `
        <div style="color: var(--success-color); font-weight: 600;">${seedHex}</div>
        <div style="margin-top: 4px; font-size: 10px;">64 hex символа = 32 байта</div>
    `;
}

// Переключение отображения процесса генерации seed
function toggleSeedGeneration() {
    const processEl = document.getElementById('seedGenerationProcess');
    const btn = document.getElementById('showSeedGenerationBtn');
    
    if (processEl.classList.contains('hidden')) {
        processEl.classList.remove('hidden');
        btn.textContent = '🔍 Скрыть процесс генерации';
    } else {
        processEl.classList.add('hidden');
        btn.textContent = '🔍 Показать как генерируется seed';
    }
}

// Отображение победителя
function displayWinner(winner, score) {
    const container = document.getElementById('winnerDisplay');
    container.innerHTML = `
        <div style="font-size: 1.2em; margin-bottom: 10px; word-break: break-word;">Билет №${winner}</div>
        <div class="winner-score">Score: ${score}</div>
    `;
}

// Отображение списка билетов
function displayTickets(tickets, scores, winner) {
    const container = document.getElementById('ticketsList');
    const showAll = document.getElementById('showAllScores').checked;
    
    container.innerHTML = tickets.map(ticket => {
        const isWinner = ticket === winner;
        const score = scores[ticket];
        
        return `
            <div class="ticket-item ${isWinner ? 'winner' : ''}">
                <div class="ticket-number">Билет №${ticket}</div>
                <div class="ticket-score ${showAll ? '' : 'hidden'}">
                    Score: ${score}
                </div>
            </div>
        `;
    }).join('');
}

// Переключение отображения score
function toggleScores() {
    const showAll = document.getElementById('showAllScores').checked;
    const scoreElements = document.querySelectorAll('.ticket-score');
    
    scoreElements.forEach(el => {
        if (showAll) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

// Отображение процесса выбора победителя
function displayWinnerSelection(tickets, scores, winner) {
    const processEl = document.getElementById('winnerSelectionProcess');
    
    // Шаг 1: Вычисление Score для каждого билета
    const scoresList = tickets.map(ticket => {
        const score = scores[ticket];
        const isWinner = ticket === winner;
        return {
            ticket,
            score,
            isWinner
        };
    }).sort((a, b) => {
        // Сортируем по score (как строки для правильного сравнения больших чисел)
        const scoreA = BigInt(a.score);
        const scoreB = BigInt(b.score);
        return scoreA < scoreB ? -1 : scoreA > scoreB ? 1 : 0;
    });
    
    document.getElementById('scoresCalculation').innerHTML = `
        <div style="max-height: 150px; overflow-y: auto;">
            ${scoresList.map((item, index) => `
                <div style="margin-bottom: 6px; padding: 6px; background: ${item.isWinner ? 'rgba(255, 215, 0, 0.2)' : 'transparent'}; border-radius: 4px; border-left: ${item.isWinner ? '3px solid #ffd700' : 'none'};">
                    <strong>Билет №${item.ticket}:</strong> 
                    <span style="font-family: monospace; font-size: 10px;">${item.score.substring(0, 30)}...</span>
                    ${item.isWinner ? ' 🏆' : ''}
                </div>
            `).join('')}
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);">
            <strong>Всего билетов:</strong> ${tickets.length}
        </div>
    `;
    
    // Шаг 2: Поиск минимального Score
    const winnerScore = scores[winner];
    const minScoreInfo = scoresList[0];
    document.getElementById('minScoreInfo').innerHTML = `
        <div style="margin-bottom: 4px;">Сравниваем все Score между собой</div>
        <div style="margin-bottom: 4px;">→ Ищем минимальное значение</div>
        <div style="margin-top: 8px; padding: 8px; background: rgba(255, 215, 0, 0.2); border-radius: 6px; border-left: 3px solid #ffd700;">
            <strong>Минимальный Score:</strong> ${minScoreInfo.score.substring(0, 40)}...
            <br><strong>Билет:</strong> №${minScoreInfo.ticket}
        </div>
    `;
    
    // Шаг 3: Победитель
    document.getElementById('winnerInfo').innerHTML = `
        <div style="font-size: 18px; font-weight: 700; color: #333; margin-bottom: 8px;">
            🏆 Билет №${winner}
        </div>
        <div style="font-size: 12px; color: #666;">
            Score: ${winnerScore.substring(0, 30)}...
        </div>
        <div style="margin-top: 8px; font-size: 11px; color: #666;">
            Формула: SHA256(seed + ":" + "${winner}") → ${winnerScore.length} цифр
        </div>
    `;
}

// Переключение отображения процесса выбора победителя
function toggleWinnerSelection() {
    const processEl = document.getElementById('winnerSelectionProcess');
    const btn = document.getElementById('showWinnerSelectionBtn');
    
    if (processEl.classList.contains('hidden')) {
        processEl.classList.remove('hidden');
        btn.textContent = '🔍 Скрыть процесс выбора';
    } else {
        processEl.classList.add('hidden');
        btn.textContent = '🔍 Показать как выбирается победитель';
    }
}

// Отображение proof данных
function displayProof(proof) {
    const container = document.getElementById('proofData');
    container.textContent = JSON.stringify(proof, null, 2);
}

// Копирование proof данных
function copyProof() {
    const proofData = document.getElementById('proofData').textContent;
    navigator.clipboard.writeText(proofData).then(() => {
        const btn = document.getElementById('copyProofBtn');
        const originalText = btn.textContent;
        btn.textContent = '✅ Скопировано!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

// Обновление визуальной схемы
function updateVisualFlow(result) {
    document.getElementById('flowBlock').textContent = 
        result.block_hashes[0].substring(0, 20) + '...';
    
    document.getElementById('flowSeed').textContent = 
        result.seed_hex.substring(0, 20) + '...';
    
    document.getElementById('flowTickets').textContent = 
        `${result.tickets.length} билетов`;
    
    const scoresText = Object.entries(result.scores)
        .slice(0, 3)
        .map(([ticket, score]) => `Билет ${ticket}: ${score.substring(0, 10)}...`)
        .join('\n');
    document.getElementById('flowScores').textContent = scoresText || '-';
    
    document.getElementById('flowWinner').textContent = 
        `Билет №${result.winner}\nScore: ${result.scores[result.winner]}`;
}

// Переключение управления билетами
function toggleTicketsManagement() {
    const managementEl = document.getElementById('ticketsManagement');
    const resultsEl = document.getElementById('results');
    
    if (managementEl.classList.contains('hidden')) {
        managementEl.classList.remove('hidden');
        resultsEl.classList.add('hidden');
        loadTicketsList();
    } else {
        managementEl.classList.add('hidden');
    }
}

// Загрузка списка билетов для управления
async function loadTicketsList() {
    try {
        const response = await fetch(`${API_BASE}/api/lottery/tickets`);
        const data = await response.json();
        
        if (data.success) {
            displayTicketsList(data.tickets);
        }
    } catch (error) {
        showError('Ошибка при загрузке билетов: ' + error.message);
    }
}

// Отображение списка билетов для управления
function displayTicketsList(tickets) {
    const container = document.getElementById('ticketsListManagement');
    const countEl = document.getElementById('ticketsCount');
    
    countEl.textContent = tickets.length;
    
    if (tickets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Нет билетов. Добавьте первый билет!</p>';
        return;
    }
    
    container.innerHTML = tickets.map(ticket => `
        <div class="ticket-item-editable">
            <span class="ticket-number-display">Билет №${ticket}</span>
            <button class="ticket-remove-btn" onclick="removeTicket(${ticket})">✕</button>
        </div>
    `).join('');
}

// Добавление билета
async function addTicket() {
    const input = document.getElementById('newTicketNumber');
    const ticketNumber = input.value.trim();
    
    if (!ticketNumber) {
        showError('Введите номер билета');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/lottery/tickets/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticket_number: ticketNumber
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            loadTicketsList();
            showSuccess(data.message || 'Билет успешно добавлен');
        } else {
            showError(data.error || 'Ошибка при добавлении билета');
        }
    } catch (error) {
        showError('Ошибка при добавлении билета: ' + error.message);
    }
}

// Удаление билета
async function removeTicket(ticketNumber) {
    if (!confirm(`Удалить билет №${ticketNumber}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/lottery/tickets/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticket_number: ticketNumber
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTicketsList();
            showSuccess(data.message || 'Билет успешно удалён');
        } else {
            showError(data.error || 'Ошибка при удалении билета');
        }
    } catch (error) {
        showError('Ошибка при удалении билета: ' + error.message);
    }
}

// Очистка всех билетов
async function clearAllTickets() {
    if (!confirm('Вы уверены, что хотите удалить все билеты?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/lottery/tickets/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tickets: []
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadTicketsList();
            showSuccess('Все билеты удалены');
        } else {
            showError(data.error || 'Ошибка при очистке билетов');
        }
    } catch (error) {
        showError('Ошибка при очистке билетов: ' + error.message);
    }
}

// Показать модальное окно импорта
function showImportModal() {
    document.getElementById('importModal').classList.remove('hidden');
    document.getElementById('importTextarea').value = '';
}

// Скрыть модальное окно импорта
function hideImportModal() {
    document.getElementById('importModal').classList.add('hidden');
}

// Импорт билетов
async function importTickets() {
    const textarea = document.getElementById('importTextarea');
    const text = textarea.value.trim();
    
    if (!text) {
        showError('Введите номера билетов');
        return;
    }
    
    // Парсим текст: разделяем по запятым или переносам строк
    const tickets = text
        .split(/[,\n\r]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => {
            // Удаляем все нецифровые символы кроме минуса в начале
            const cleaned = t.replace(/[^\d-]/g, '');
            return cleaned ? parseInt(cleaned) : null;
        })
        .filter(t => t !== null && !isNaN(t));
    
    if (tickets.length === 0) {
        showError('Не найдено валидных номеров билетов');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/lottery/tickets/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tickets: tickets
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            hideImportModal();
            loadTicketsList();
            showSuccess(data.message || `Импортировано ${tickets.length} билетов`);
        } else {
            showError(data.error || 'Ошибка при импорте билетов');
        }
    } catch (error) {
        showError('Ошибка при импорте билетов: ' + error.message);
    }
}

// Экспорт билетов
async function exportTickets() {
    try {
        const response = await fetch(`${API_BASE}/api/lottery/tickets`);
        const data = await response.json();
        
        if (data.success) {
            const text = data.tickets.join(', ');
            navigator.clipboard.writeText(text).then(() => {
                showSuccess(`Список билетов скопирован в буфер обмена:\n${text}`);
            }).catch(() => {
                // Fallback: показать в alert
                alert(`Список билетов:\n\n${text}`);
            });
        }
    } catch (error) {
        showError('Ошибка при экспорте билетов: ' + error.message);
    }
}

// Показать сообщение об успехе
function showSuccess(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = `✅ ${message}`;
    errorEl.style.background = '#d4edda';
    errorEl.style.color = '#155724';
    errorEl.style.borderLeftColor = '#28a745';
    errorEl.classList.remove('hidden');
    
    // Вибрация в Telegram
    if (typeof tg !== 'undefined' && tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 3000);
}

// Показать ошибку с вибрацией
function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = `❌ Ошибка: ${message}`;
    errorEl.style.background = '#ffebee';
    errorEl.style.color = '#c62828';
    errorEl.style.borderLeftColor = '#dc3545';
    errorEl.classList.remove('hidden');
    
    // Вибрация в Telegram
    if (typeof tg !== 'undefined' && tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
    }
}

