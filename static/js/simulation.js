/**
 * BTC Lottery - Simulation Mode
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Simulation mode loading...');
    
    // ---------- State ----------
    var state = {
        currentPlayer: 'player',
        players: {
            player: { name: 'You', balance: 11, tickets: [] },
            bot1: { name: 'Bot 1', balance: 11, tickets: [] },
            bot2: { name: 'Bot 2', balance: 11, tickets: [] }
        },
        totalSlots: 33,
        selectedSlots: [],
        availableCards: [],
        isRunning: false,
        isProcessing: false
    };
    
    // ---------- DOM References ----------
    var elements = {
        ticketsGrid: document.getElementById('ticketsGrid'),
        selectedSlotsGrid: document.getElementById('selectedSlotsGrid'),
        selectedSlotsCount: document.getElementById('selectedSlotsCount'),
        slotsCount: document.getElementById('slotsCount'),
        slotsProgress: document.getElementById('slotsProgress'),
        playerBalance: document.getElementById('playerBalance'),
        bot1Balance: document.getElementById('bot1Balance'),
        bot2Balance: document.getElementById('bot2Balance'),
        playerTicketsCount: document.getElementById('playerTicketsCount'),
        bot1TicketsCount: document.getElementById('bot1TicketsCount'),
        bot2TicketsCount: document.getElementById('bot2TicketsCount'),
        currentPlayerTitle: document.getElementById('currentPlayerTitle'),
        runBtn: document.getElementById('runSimulationBtn'),
        resetBtn: document.getElementById('resetSimulationBtn')
    };
    
    // ---------- Initialization ----------
    function initSimulation() {
        state.availableCards = [];
        for (var i = 1; i <= 33; i++) {
            state.availableCards.push(i);
        }
        state.selectedSlots = [];
        
        for (var key in state.players) {
            if (state.players.hasOwnProperty(key)) {
                state.players[key].tickets = [];
                state.players[key].balance = 11;
            }
        }
        
        state.currentPlayer = 'player';
        state.isRunning = false;
        state.isProcessing = false;
        
        renderCards();
        renderSlots();
        updateUI();
        console.log('Simulation initialized');
    }
    
    // ---------- Main Selection Flow ----------
    function selectCard(cardNumber) {
        if (state.isRunning) return;
        if (state.isProcessing) return;
        if (state.selectedSlots.length >= state.totalSlots) {
            showToast('All slots are filled!', 'warning');
            return;
        }
        
        var player = state.players[state.currentPlayer];
        if (player.balance <= 0) {
            showToast('Not enough balance!', 'error');
            return;
        }
        
        if (state.selectedSlots.indexOf(cardNumber) !== -1) {
            showToast('Card already selected!', 'warning');
            return;
        }
        
        // Add card for current player
        state.selectedSlots.push(cardNumber);
        player.tickets.push(cardNumber);
        player.balance -= 1;
        
        renderCards();
        renderSlots();
        updateUI();
        
        // Check if all slots filled
        if (state.selectedSlots.length >= state.totalSlots) {
            showToast('All slots filled! Run simulation!', 'success');
            return;
        }
        
        // Switch to next player (bot1)
        state.isProcessing = true;
        state.currentPlayer = 'bot1';
        renderCards();
        updateUI();
        
        // Bot 1 turn after delay
        setTimeout(function() {
            doBotTurn('bot1');
            
            // Switch to bot2
            state.currentPlayer = 'bot2';
            renderCards();
            updateUI();
            
            // Bot 2 turn after delay
            setTimeout(function() {
                doBotTurn('bot2');
                
                // Switch back to player
                state.currentPlayer = 'player';
                state.isProcessing = false;
                renderCards();
                updateUI();
                
                // Check if all slots filled after bots
                if (state.selectedSlots.length >= state.totalSlots) {
                    showToast('All slots filled! Run simulation!', 'success');
                } else {
                    showToast('Your turn! Select a card.', 'info');
                }
            }, 400);
        }, 400);
    }
    
    // ---------- Bot Turn ----------
    function doBotTurn(botKey) {
        var bot = state.players[botKey];
        if (!bot || bot.balance <= 0) return;
        if (state.selectedSlots.length >= state.totalSlots) return;
        
        // Find available cards
        var available = [];
        for (var i = 0; i < state.availableCards.length; i++) {
            if (state.selectedSlots.indexOf(state.availableCards[i]) === -1) {
                available.push(state.availableCards[i]);
            }
        }
        if (available.length === 0) return;
        
        // Bot selects random card
        var randomIndex = Math.floor(Math.random() * available.length);
        var card = available[randomIndex];
        
        state.selectedSlots.push(card);
        bot.tickets.push(card);
        bot.balance -= 1;
        
        console.log(botKey + ' selected card ' + card);
        
        renderCards();
        renderSlots();
        updateUI();
    }
    
    // ---------- Render Functions ----------
    function renderCards() {
        if (!elements.ticketsGrid) return;
        
        elements.ticketsGrid.innerHTML = '';
        
        for (var i = 0; i < state.availableCards.length; i++) {
            var num = state.availableCards[i];
            var isSelected = state.selectedSlots.indexOf(num) !== -1;
            var isPlayerCard = state.players.player.tickets.indexOf(num) !== -1;
            var isBot1Card = state.players.bot1.tickets.indexOf(num) !== -1;
            var isBot2Card = state.players.bot2.tickets.indexOf(num) !== -1;
            var isBotCard = isBot1Card || isBot2Card;
            
            // Create Cyber Card container
            var container = document.createElement('div');
            container.className = 'ticket-card-container noselect';
            container.dataset.card = num;
            
            if (isSelected) {
                container.classList.add('selected');
            }
            
            // Canvas with 25 trackers
            var canvas = document.createElement('div');
            canvas.className = 'ticket-card-canvas';
            
            for (var t = 1; t <= 25; t++) {
                var tracker = document.createElement('div');
                tracker.className = 'ticket-card-tracker tr-' + t;
                canvas.appendChild(tracker);
            }
            
            // Card content
            var card = document.createElement('div');
            card.className = 'ticket-card';
            
            var prompt = document.createElement('p');
            prompt.className = 'ticket-prompt';
            if (isSelected) {
                prompt.textContent = 'TAKEN';
                prompt.style.color = '#ff6b6b';
            } else if (isPlayerCard) {
                prompt.textContent = 'YOU';
                prompt.style.color = '#00ffaa';
            } else if (isBotCard) {
                prompt.textContent = 'BOT';
                prompt.style.color = '#ffaa00';
            } else {
                prompt.textContent = 'CLICK';
            }
            
            var title = document.createElement('div');
            title.className = 'ticket-card-title';
            title.textContent = num;
            
            var subtitle = document.createElement('div');
            subtitle.className = 'ticket-card-subtitle';
            subtitle.textContent = '';
            
            card.appendChild(prompt);
            card.appendChild(title);
            card.appendChild(subtitle);
            canvas.appendChild(card);
            container.appendChild(canvas);
            
            // Click handler
            if (!isSelected) {
                container.addEventListener('click', (function(n) {
                    return function() {
                        window.simulationSelectCard(n);
                    };
                })(num));
            } else {
                container.style.opacity = '0.5';
                container.style.cursor = 'not-allowed';
            }
            
            elements.ticketsGrid.appendChild(container);
        }
    }
    
    function renderSlots() {
        if (!elements.selectedSlotsGrid) return;
        
        if (state.selectedSlots.length === 0) {
            elements.selectedSlotsGrid.innerHTML = '<p class="text-muted" style="font-size:var(--font-size-sm);width:100%;text-align:center;padding:20px 0;">Select cards above to fill slots</p>';
            return;
        }
        
        var sorted = state.selectedSlots.slice().sort(function(a, b) { return a - b; });
        var html = '';
        for (var i = 0; i < sorted.length; i++) {
            var num = sorted[i];
            var owner = getCardOwner(num);
            var classes = 'slot-item';
            var label = num;
            
            if (owner === 'player') {
                classes += ' filled';
                label = 'P' + num;
            } else if (owner === 'bot1' || owner === 'bot2') {
                classes += ' bot-filled';
                label = 'B' + num;
            }
            
            html += '<div class="' + classes + '" title="' + getPlayerName(owner) + '">' + label + '</div>';
        }
        
        elements.selectedSlotsGrid.innerHTML = html;
    }
    
    function getCardOwner(cardNumber) {
        for (var key in state.players) {
            if (state.players.hasOwnProperty(key)) {
                if (state.players[key].tickets.indexOf(cardNumber) !== -1) {
                    return key;
                }
            }
        }
        return null;
    }
    
    function getPlayerName(key) {
        var names = { player: 'You', bot1: 'Bot 1', bot2: 'Bot 2' };
        return names[key] || key;
    }
    
    function updateUI() {
        if (elements.playerBalance) elements.playerBalance.textContent = state.players.player.balance;
        if (elements.bot1Balance) elements.bot1Balance.textContent = state.players.bot1.balance;
        if (elements.bot2Balance) elements.bot2Balance.textContent = state.players.bot2.balance;
        
        if (elements.playerTicketsCount) {
            elements.playerTicketsCount.textContent = state.players.player.tickets.length + ' tickets';
        }
        if (elements.bot1TicketsCount) {
            elements.bot1TicketsCount.textContent = state.players.bot1.tickets.length + ' tickets';
        }
        if (elements.bot2TicketsCount) {
            elements.bot2TicketsCount.textContent = state.players.bot2.tickets.length + ' tickets';
        }
        
        var count = state.selectedSlots.length;
        if (elements.selectedSlotsCount) elements.selectedSlotsCount.textContent = count;
        if (elements.slotsCount) elements.slotsCount.textContent = count + ' / ' + state.totalSlots;
        
        var progress = (count / state.totalSlots) * 100;
        if (elements.slotsProgress) elements.slotsProgress.style.width = Math.min(progress, 100) + '%';
        
        // FIXED: Always show "Cards pool" as the title
        if (elements.currentPlayerTitle) {
            elements.currentPlayerTitle.textContent = 'Cards pool';
        }
        
        var cards = document.querySelectorAll('.player-card');
        for (var i = 0; i < cards.length; i++) {
            cards[i].classList.remove('active');
        }
        var activeEl = document.getElementById(state.currentPlayer + 'Info');
        if (activeEl) activeEl.classList.add('active');
        
        if (elements.runBtn) {
            var filled = state.selectedSlots.length === state.totalSlots;
            elements.runBtn.disabled = !filled || state.isRunning;
            elements.runBtn.textContent = state.isRunning ? 'Running...' : 'Run Simulation';
        }
    }
    
    // ---------- Run Simulation ----------
    function runSimulation() {
        if (state.isRunning) return;
        if (state.selectedSlots.length < state.totalSlots) {
            showToast('Fill all slots first!', 'warning');
            return;
        }
        
        state.isRunning = true;
        elements.runBtn.disabled = true;
        elements.runBtn.textContent = 'Running...';
        
        // Collect all tickets
        var allTickets = [];
        for (var key in state.players) {
            if (state.players.hasOwnProperty(key)) {
                allTickets = allTickets.concat(state.players[key].tickets);
            }
        }
        
        console.log('All tickets:', allTickets);
        
        // Run lottery
        fetch('/api/lottery/draw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ block_count: 3, tickets: allTickets })
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.success) {
                var result = data.result || data;
                displaySimulationResults(result);
            } else {
                showToast('Simulation failed: ' + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(function(err) {
            showToast('Error: ' + err.message, 'error');
        })
        .finally(function() {
            state.isRunning = false;
            elements.runBtn.disabled = false;
            elements.runBtn.textContent = 'Run Simulation';
        });
    }
    
    function displaySimulationResults(result) {
        // Find winner player
        var winnerPlayer = 'Unknown';
        for (var key in state.players) {
            if (state.players.hasOwnProperty(key)) {
                if (state.players[key].tickets.indexOf(parseInt(result.winner)) !== -1) {
                    winnerPlayer = getPlayerName(key);
                    break;
                }
            }
        }
        
        showToast(winnerPlayer + ' wins with ticket #' + result.winner + '!', 'success');
        
        // Show detailed results
        var resultsDiv = document.getElementById('results');
        if (resultsDiv) {
            resultsDiv.classList.remove('hidden');
            
            var winnerDisplay = document.getElementById('winnerDisplay');
            if (winnerDisplay) winnerDisplay.textContent = '#' + result.winner + ' (' + winnerPlayer + ')';
            
            var seedDisplay = document.getElementById('seedDisplay');
            if (seedDisplay) seedDisplay.textContent = result.seed_hex || 'N/A';
            
            var blockHashes = document.getElementById('blockHashes');
            if (blockHashes && result.block_hashes) {
                var blockHtml = '';
                for (var i = 0; i < result.block_hashes.length; i++) {
                    blockHtml += '<div style="margin:4px 0;font-size:12px;">Block ' + (i+1) + ': <code style="word-break:break-all;">' + result.block_hashes[i] + '</code></div>';
                }
                blockHashes.innerHTML = blockHtml;
            }
            
            var ticketsList = document.getElementById('ticketsList');
            if (ticketsList && result.scores) {
                var scores = result.scores;
                var sorted = Object.entries(scores).sort(function(a, b) {
                    return parseInt(a[1]) - parseInt(b[1]);
                });
                
                var html = '';
                for (var i = 0; i < sorted.length; i++) {
                    var item = sorted[i];
                    var ticket = item[0];
                    var score = item[1];
                    var isWinner = ticket == result.winner;
                    var medal = '';
                    if (i === 0) medal = '1.';
                    else if (i === 1) medal = '2.';
                    else if (i === 2) medal = '3.';
                    var owner = getCardOwner(parseInt(ticket));
                    var ownerName = owner ? getPlayerName(owner) : '';
                    
                    html += '<div class="score-item ' + (isWinner ? 'winner' : '') + '" style="display:flex;justify-content:space-between;padding:6px 12px;background:' + (isWinner ? 'var(--accent)' : 'var(--bg-secondary)') + ';border-radius:6px;margin:2px 0;color:' + (isWinner ? 'var(--bg-primary)' : 'var(--text-primary)') + ';">' +
                        '<span class="ticket-num">' + medal + ' #' + ticket + (isWinner ? ' WINNER' : '') + ' ' + ownerName + '</span>' +
                        '<span class="score-val" style="font-family:monospace;font-size:11px;">' + score + '</span>' +
                    '</div>';
                }
                ticketsList.innerHTML = html;
            }
            
            // Show verification data
            var proofData = document.getElementById('proofData');
            if (proofData) {
                proofData.textContent = JSON.stringify(result, null, 2);
            }
            
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    // ---------- Reset ----------
    function resetSimulation() {
        if (state.isRunning) return;
        if (state.selectedSlots.length > 0 && !confirm('Reset simulation?')) return;
        
        initSimulation();
        showToast('Simulation reset', 'info');
    }
    
    // ---------- Toast ----------
    function showToast(message, type) {
        type = type || 'info';
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        var toast = document.createElement('div');
        toast.className = 'toast ' + type;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }
    
    // ---------- Event Listeners ----------
    var playerCards = document.querySelectorAll('.player-card');
    for (var i = 0; i < playerCards.length; i++) {
        playerCards[i].addEventListener('click', function() {
            var id = this.id;
            if (id && id.indexOf('Info') !== -1) {
                var key = id.replace('Info', '');
                state.currentPlayer = key;
                renderCards();
                updateUI();
                console.log('Switched to ' + key);
            }
        });
    }
    
    window.simulationSelectCard = function(cardNumber) {
        selectCard(cardNumber);
    };
    
    if (elements.runBtn) {
        elements.runBtn.addEventListener('click', runSimulation);
    }
    
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', resetSimulation);
    }
    
    // ---------- Init ----------
    initSimulation();
    console.log('Simulation mode ready');
});
