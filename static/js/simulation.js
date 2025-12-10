// Симуляция ивента

let simulationState = {
    mode: 'normal', // 'normal' или 'simulation'
    totalSlots: 33,
    selectedSlots: [], // Общий слот со всеми выбранными карточками
    currentPlayer: 'player', // 'player', 'bot1', 'bot2'
    playerBalance: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Карточки игрока (11 штук)
    bot1Balance: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], // Карточки бота 1 (11 штук)
    bot2Balance: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33], // Карточки бота 2 (11 штук)
    playerSelected: [], // Выбранные карточки игрока для слота
    bot1Selected: [], // Выбранные карточки бота 1 для слота
    bot2Selected: [], // Выбранные карточки бота 2 для слота
    botThinking: false
};

// Переключение режимов
function switchMode(mode) {
    simulationState.mode = mode;
    
    const normalModeEl = document.getElementById('normalMode');
    const simulationModeEl = document.getElementById('simulationMode');
    const normalModeBtn = document.getElementById('normalModeBtn');
    const simulationModeBtn = document.getElementById('simulationModeBtn');
    
    if (mode === 'normal') {
        if (normalModeEl) normalModeEl.classList.remove('hidden');
        if (simulationModeEl) simulationModeEl.classList.add('hidden');
        if (normalModeBtn) normalModeBtn.classList.add('active');
        if (simulationModeBtn) simulationModeBtn.classList.remove('active');
    } else {
        if (normalModeEl) normalModeEl.classList.add('hidden');
        if (simulationModeEl) simulationModeEl.classList.remove('hidden');
        if (normalModeBtn) normalModeBtn.classList.remove('active');
        if (simulationModeBtn) simulationModeBtn.classList.add('active');
        
        // Инициализируем симуляцию
        initSimulation();
    }
}

// Инициализация симуляции
function initSimulation() {
    resetSimulation();
    createTicketCards();
    showPlayerTickets('player');
    updateSimulationUI();
}

// Сброс симуляции
function resetSimulation() {
    simulationState.selectedSlots = [];
    simulationState.currentPlayer = 'player';
    simulationState.playerSelected = [];
    simulationState.bot1Selected = [];
    simulationState.bot2Selected = [];
    simulationState.botThinking = false;
    
    showPlayerTickets('player');
    updateSelectedSlotsDisplay();
    updateSimulationUI();
}

// Создание карточек билетов
function createTicketCards() {
    const grid = document.getElementById('ticketsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Все доступные билеты (1-33)
    const allTickets = [...simulationState.playerBalance, ...simulationState.bot1Balance, ...simulationState.bot2Balance];
    
    allTickets.forEach(ticketNumber => {
        const card = createTicketCard(ticketNumber);
        grid.appendChild(card);
    });
}

// Показ карточек текущего игрока
function showPlayerTickets(player) {
    const grid = document.getElementById('ticketsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    let tickets = [];
    let playerName = '';
    
    // Показываем ВСЕ карточки игрока, не только невыбранные
    if (player === 'player') {
        tickets = [...simulationState.playerBalance]; // Все карточки игрока
        playerName = 'Ваши карточки';
    } else if (player === 'bot1') {
        tickets = [...simulationState.bot1Balance]; // Все карточки бота 1
        playerName = 'Карточки Бота 1';
    } else if (player === 'bot2') {
        tickets = [...simulationState.bot2Balance]; // Все карточки бота 2
        playerName = 'Карточки Бота 2';
    }
    
    const titleEl = document.getElementById('currentPlayerTitle');
    if (titleEl) titleEl.textContent = playerName;
    
    tickets.forEach(ticketNumber => {
        const card = createTicketCard(ticketNumber);
        grid.appendChild(card);
    });
    
    updateSimulationUI();
}

// Создание одной карточки билета
function createTicketCard(ticketNumber) {
    const container = document.createElement('div');
    container.className = 'ticket-card-container noselect';
    container.dataset.ticketNumber = ticketNumber;
    
    // Проверяем, выбрана ли эта карточка
    const isSelected = simulationState.selectedSlots.includes(ticketNumber);
    if (isSelected) {
        container.classList.add('ticket-selected');
    }
    
    const canvas = document.createElement('div');
    canvas.className = 'ticket-card-canvas';
    
    // Создаем 25 трекеров
    for (let i = 1; i <= 25; i++) {
        const tracker = document.createElement('div');
        tracker.className = `ticket-card-tracker tr-${i}`;
        canvas.appendChild(tracker);
    }
    
    const card = document.createElement('div');
    card.className = 'ticket-card';
    
    const prompt = document.createElement('p');
    prompt.className = 'ticket-prompt';
    if (isSelected) {
        prompt.textContent = 'ВЫБРАНО';
        prompt.style.color = '#00ffaa';
    } else {
        prompt.textContent = 'НАЖМИ';
    }
    
    const title = document.createElement('div');
    title.className = 'ticket-card-title';
    title.textContent = `Ticket #${ticketNumber}`; // Номер карточки всегда виден
    
    const subtitle = document.createElement('div');
    subtitle.className = 'ticket-card-subtitle';
    subtitle.textContent = `Билет ${ticketNumber}`;
    
    card.appendChild(prompt);
    card.appendChild(title);
    card.appendChild(subtitle);
    canvas.appendChild(card);
    container.appendChild(canvas);
    
    // Обработчик клика (только если карточка не выбрана)
    if (!isSelected) {
        container.addEventListener('click', handleTicketClick);
    } else {
        container.style.opacity = '0.7';
        container.style.cursor = 'not-allowed';
    }
    
    return container;
}

// Обработчик клика на карточку
function handleTicketClick(event) {
    const container = event.currentTarget;
    const ticketNumber = parseInt(container.dataset.ticketNumber);
    
    if (isNaN(ticketNumber)) return;
    
    // Проверяем, может ли текущий игрок выбрать этот билет
    if (simulationState.currentPlayer === 'player') {
        if (!simulationState.playerBalance.includes(ticketNumber)) return;
        if (simulationState.playerSelected.includes(ticketNumber)) return;
        if (simulationState.selectedSlots.includes(ticketNumber)) return;
        
        selectTicket(ticketNumber, 'player');
    }
}

// Выбор билета игроком или ботом
function selectTicket(ticketNumber, player) {
    if (simulationState.selectedSlots.includes(ticketNumber)) return;
    if (simulationState.selectedSlots.length >= simulationState.totalSlots) return;
    
    if (player === 'player') {
        if (!simulationState.playerBalance.includes(ticketNumber)) return;
        if (simulationState.playerSelected.includes(ticketNumber)) return;
        simulationState.playerSelected.push(ticketNumber);
    } else if (player === 'bot1') {
        if (!simulationState.bot1Balance.includes(ticketNumber)) return;
        if (simulationState.bot1Selected.includes(ticketNumber)) return;
        simulationState.bot1Selected.push(ticketNumber);
    } else if (player === 'bot2') {
        if (!simulationState.bot2Balance.includes(ticketNumber)) return;
        if (simulationState.bot2Selected.includes(ticketNumber)) return;
        simulationState.bot2Selected.push(ticketNumber);
    }
    
    simulationState.selectedSlots.push(ticketNumber);
    
    // Обновляем отображение карточек СРАЗУ, чтобы пометить выбранные
    showPlayerTickets(simulationState.currentPlayer);
    updateSimulationUI();
    updateSelectedSlotsDisplay();
    
    // Проверяем, заполнены ли все слоты
    if (simulationState.selectedSlots.length >= simulationState.totalSlots) {
        setTimeout(() => {
            conductSimulationDraw();
        }, 500);
    } else {
        // Боты выбирают билеты
        setTimeout(() => {
            botSelectTickets();
        }, 300);
    }
}

// Боты выбирают билеты
function botSelectTickets() {
    if (simulationState.botThinking) return;
    if (simulationState.selectedSlots.length >= simulationState.totalSlots) return;
    
    simulationState.botThinking = true;
    
    // Бот 1 выбирает случайный билет из своего баланса
    if (simulationState.selectedSlots.length < simulationState.totalSlots) {
        const bot1Available = simulationState.bot1Balance.filter(
            t => !simulationState.bot1Selected.includes(t)
        );
        if (bot1Available.length > 0) {
            const bot1Ticket = bot1Available[Math.floor(Math.random() * bot1Available.length)];
            simulationState.bot1Selected.push(bot1Ticket);
            simulationState.selectedSlots.push(bot1Ticket);
        }
    }
    
    // Бот 2 выбирает случайный билет из своего баланса
    if (simulationState.selectedSlots.length < simulationState.totalSlots) {
        const bot2Available = simulationState.bot2Balance.filter(
            t => !simulationState.bot2Selected.includes(t)
        );
        if (bot2Available.length > 0) {
            const bot2Ticket = bot2Available[Math.floor(Math.random() * bot2Available.length)];
            simulationState.bot2Selected.push(bot2Ticket);
            simulationState.selectedSlots.push(bot2Ticket);
        }
    }
    
    simulationState.botThinking = false;
    updateSimulationUI();
    updateSelectedSlotsDisplay();
    
    // Проверяем, заполнены ли все слоты
    if (simulationState.selectedSlots.length >= simulationState.totalSlots) {
        setTimeout(() => {
            conductSimulationDraw();
        }, 500);
    }
}

// Обновление UI симуляции
function updateSimulationUI() {
    const slotsCount = simulationState.selectedSlots.length;
    const totalSlots = simulationState.totalSlots;
    
    const slotsCountEl = document.getElementById('slotsCount');
    const slotsProgressEl = document.getElementById('slotsProgress');
    const selectedSlotsCountEl = document.getElementById('selectedSlotsCount');
    const playerTicketsCountEl = document.getElementById('playerTicketsCount');
    const bot1TicketsCountEl = document.getElementById('bot1TicketsCount');
    const bot2TicketsCountEl = document.getElementById('bot2TicketsCount');
    
    const playerBalanceEl = document.getElementById('playerBalance');
    const bot1BalanceEl = document.getElementById('bot1Balance');
    const bot2BalanceEl = document.getElementById('bot2Balance');
    
    if (slotsCountEl) slotsCountEl.textContent = `${slotsCount} / ${totalSlots}`;
    if (selectedSlotsCountEl) selectedSlotsCountEl.textContent = slotsCount;
    if (slotsProgressEl) {
        const progress = (slotsCount / totalSlots) * 100;
        slotsProgressEl.style.width = `${progress}%`;
    }
    
    if (playerTicketsCountEl) playerTicketsCountEl.textContent = simulationState.playerSelected.length;
    if (bot1TicketsCountEl) bot1TicketsCountEl.textContent = simulationState.bot1Selected.length;
    if (bot2TicketsCountEl) bot2TicketsCountEl.textContent = simulationState.bot2Selected.length;
    
    if (playerBalanceEl) playerBalanceEl.textContent = simulationState.playerBalance.length - simulationState.playerSelected.length;
    if (bot1BalanceEl) bot1BalanceEl.textContent = simulationState.bot1Balance.length - simulationState.bot1Selected.length;
    if (bot2BalanceEl) bot2BalanceEl.textContent = simulationState.bot2Balance.length - simulationState.bot2Selected.length;
}

// Обновление отображения выбранных слотов
function updateSelectedSlotsDisplay() {
    const grid = document.getElementById('selectedSlotsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    simulationState.selectedSlots.forEach(ticketNumber => {
        const slot = document.createElement('div');
        slot.className = 'selected-slot';
        slot.textContent = `#${ticketNumber}`;
        
        // Определяем, кто выбрал эту карточку
        if (simulationState.playerSelected.includes(ticketNumber)) {
            slot.classList.add('slot-player');
        } else if (simulationState.bot1Selected.includes(ticketNumber)) {
            slot.classList.add('slot-bot1');
        } else if (simulationState.bot2Selected.includes(ticketNumber)) {
            slot.classList.add('slot-bot2');
        }
        
        grid.appendChild(slot);
    });
}

// Проведение розыгрыша симуляции
async function conductSimulationDraw() {
    if (simulationState.selectedSlots.length < simulationState.totalSlots) {
        return;
    }
    
    // Показываем лоадер
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    
    try {
        // Используем все выбранные билеты для розыгрыша
        const result = await conductLotteryDraw(simulationState.selectedSlots, 3);
        currentResult = result;
        
        // Определяем, кто выбрал победивший билет
        // Преобразуем winner в число и проверяем все варианты
        const winnerTicket = typeof result.winner === 'string' ? parseInt(result.winner, 10) : Number(result.winner);
        let winnerName = 'Неизвестно';
        
        // Преобразуем все массивы в числа для сравнения
        const playerSelectedNumbers = simulationState.playerSelected.map(n => Number(n));
        const bot1SelectedNumbers = simulationState.bot1Selected.map(n => Number(n));
        const bot2SelectedNumbers = simulationState.bot2Selected.map(n => Number(n));
        
        // Проверяем, кто выбрал этот билет
        if (playerSelectedNumbers.includes(winnerTicket)) {
            winnerName = 'Вы';
        } else if (bot1SelectedNumbers.includes(winnerTicket)) {
            winnerName = 'Бот 1';
        } else if (bot2SelectedNumbers.includes(winnerTicket)) {
            winnerName = 'Бот 2';
        }
        
        // Логируем для отладки
        console.log('Победивший билет (тип):', typeof winnerTicket, winnerTicket);
        console.log('Выбранные игроком:', playerSelectedNumbers);
        console.log('Выбранные ботом 1:', bot1SelectedNumbers);
        console.log('Выбранные ботом 2:', bot2SelectedNumbers);
        console.log('Победитель:', winnerName);
        console.log('Проверка includes:', {
            player: playerSelectedNumbers.includes(winnerTicket),
            bot1: bot1SelectedNumbers.includes(winnerTicket),
            bot2: bot2SelectedNumbers.includes(winnerTicket)
        });
        
        // Показываем результаты с именем победителя
        displayResults(result);
        displaySimulationWinner(winnerTicket, result.scores[winnerTicket], winnerName);
        const resultsEl = document.getElementById('results');
        if (resultsEl) resultsEl.classList.remove('hidden');
        
        showSuccess('Розыгрыш завершен!');
    } catch (error) {
        console.error('Ошибка при проведении розыгрыша:', error);
        showError('Ошибка: ' + error.message);
    } finally {
        if (loadingEl) loadingEl.classList.add('hidden');
    }
}

// Сброс симуляции
function resetSimulation() {
    simulationState.selectedSlots = [];
    simulationState.currentPlayer = 'player';
    simulationState.playerSelected = [];
    simulationState.bot1Selected = [];
    simulationState.bot2Selected = [];
    simulationState.botThinking = false;
    
    showPlayerTickets('player');
    updateSelectedSlotsDisplay();
    updateSimulationUI();
}

// Отображение победителя для симуляции с именем игрока
function displaySimulationWinner(winnerTicket, score, winnerName) {
    const container = document.getElementById('winnerDisplay');
    if (!container) return;
    
    container.innerHTML = `
        <div>Билет №${winnerTicket}</div>
        <div style="margin-top: 8px; font-size: 18px; font-weight: 700; color: rgba(92, 103, 255, 0.9);">Победитель: ${winnerName}</div>
        <div class="winner-score">
            <span class="score-label">Score:</span>
            <span class="score-value">${score}</span>
        </div>
    `;
}
