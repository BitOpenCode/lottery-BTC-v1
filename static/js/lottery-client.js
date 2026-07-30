// Hash Hunters Client-Side Logic
// Вся логика работает в браузере без бэкенда

/**
 * Получает хеш блока Bitcoin по высоте
 */
async function getBlockHashByHeight(height) {
    const maxRetries = 3;
    const timeout = 10000; // 10 секунд
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch(`https://blockstream.info/api/block-height/${height}`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return (await response.text()).trim();
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.error(`Попытка ${attempt}/${maxRetries} - Ошибка при получении блока ${height}:`, error);
            if (attempt === maxRetries) {
                throw new Error(`Не удалось получить блок ${height} после ${maxRetries} попыток: ${error.message}`);
            }
            // Ждем перед следующей попыткой
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

/**
 * Получает высоту последнего блока Bitcoin
 */
async function getLatestBlockHeight() {
    const maxRetries = 3;
    const timeout = 10000; // 10 секунд
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            const response = await fetch('https://blockstream.info/api/blocks/tip/height', {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return parseInt((await response.text()).trim());
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            console.error(`Попытка ${attempt}/${maxRetries} - Ошибка при получении высоты блока:`, error);
            if (attempt === maxRetries) {
                throw new Error(`Не удалось получить высоту блока после ${maxRetries} попыток: ${error.message}`);
            }
            // Ждем перед следующей попыткой
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}

/**
 * Получает хеши блоков для розыгрыша
 */
async function getBlockHashesForDraw(drawBlockHeight = null, count = 3) {
    if (drawBlockHeight === null) {
        drawBlockHeight = await getLatestBlockHeight();
    }
    
    const blockHashes = [];
    const blockHeights = [];
    
    for (let i = 0; i < count; i++) {
        const height = drawBlockHeight - i;
        const hash = await getBlockHashByHeight(height);
        blockHashes.push(hash);
        blockHeights.push(height);
    }
    
    return { blockHashes, blockHeights };
}

/**
 * Вычисляет SHA256 хеш (использует Web Crypto API)
 */
async function sha256(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Генерирует seed из хешей блоков Bitcoin
 */
async function generateSeed(blockHashes) {
    const concatenated = blockHashes.join('');
    return await sha256(concatenated);
}

/**
 * Нормализует номер билета
 */
function normalizeTicketNumber(ticketNumber) {
    return String(parseInt(ticketNumber));
}

/**
 * Вычисляет score для билета
 */
async function computeScore(seedHex, ticketNumber) {
    const ticketStr = normalizeTicketNumber(ticketNumber);
    const input = seedHex + ':' + ticketStr;
    const hashHex = await sha256(input);
    // Преобразуем hex в большое число (BigInt)
    return BigInt('0x' + hashHex).toString();
}

/**
 * Вычисляет tie-breaker для билета
 */
async function computeTieBreaker(seedHex, ticketNumber) {
    const ticketStr = normalizeTicketNumber(ticketNumber);
    const input = seedHex + ':' + ticketStr + ':tb1';
    const hashHex = await sha256(input);
    return BigInt('0x' + hashHex).toString();
}

/**
 * Определяет победителя из списка билетов
 */
async function pickWinner(seedHex, tickets) {
    const scores = {};
    const tieBreakers = {};
    
    // Вычисляем score для каждого билета
    for (const ticket of tickets) {
        scores[ticket] = await computeScore(seedHex, ticket);
        tieBreakers[ticket] = await computeTieBreaker(seedHex, ticket);
    }
    
    // Находим минимальный score
    let minScore = null;
    let winner = null;
    
    for (const ticket of tickets) {
        const score = scores[ticket];
        if (minScore === null || BigInt(score) < BigInt(minScore)) {
            minScore = score;
            winner = ticket;
        } else if (BigInt(score) === BigInt(minScore)) {
            // Коллизия - используем tie-breaker
            const currentTieBreaker = BigInt(tieBreakers[winner]);
            const newTieBreaker = BigInt(tieBreakers[ticket]);
            if (newTieBreaker < currentTieBreaker) {
                winner = ticket;
            }
        }
    }
    
    // Форматируем scores как строки для отображения
    const formattedScores = {};
    for (const ticket of tickets) {
        formattedScores[ticket] = scores[ticket];
    }
    
    return {
        winner: normalizeTicketNumber(winner),
        scores: formattedScores,
        proof: {
            seed_hex: seedHex,
            tickets: tickets.map(t => normalizeTicketNumber(t)),
            scores: formattedScores,
            winner: normalizeTicketNumber(winner)
        }
    };
}

/**
 * Проводит полный розыгрыш лотереи
 */
async function conductLotteryDraw(tickets, blockCount = 3) {
    // Получаем блоки Bitcoin
    const { blockHashes, blockHeights } = await getBlockHashesForDraw(null, blockCount);
    
    // Генерируем seed
    const seedHex = await generateSeed(blockHashes);
    
    // Определяем победителя
    const result = await pickWinner(seedHex, tickets);
    
    return {
        block_hashes: blockHashes,
        block_heights: blockHeights,
        seed_hex: seedHex,
        tickets: tickets.map(t => normalizeTicketNumber(t)),
        winner: result.winner,
        scores: result.scores,
        proof: result.proof
    };
}

