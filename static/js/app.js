/**
 * BTC Lottery - Frontend Application
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 BTC Lottery loading...');
    
    // ---------- DOM References ----------
    const drawBtn = document.getElementById('drawBtn');
    const ticketsList = document.getElementById('ticketsList');
    const currentTicketsDisplay = document.getElementById('currentTicketsDisplay');
    const currentTicketsCount = document.getElementById('currentTicketsCount');
    const winnerDisplay = document.getElementById('winnerDisplay');
    const seedDisplay = document.getElementById('seedDisplay');
    const blockHashes = document.getElementById('blockHashes');
    const proofData = document.getElementById('proofData');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('error');
    const copyProofBtn = document.getElementById('copyProofBtn');
    const singleList = document.getElementById('singleTicketsList');
    const bulkList = document.getElementById('bulkTicketsList');
    
    // ---------- State ----------
    let currentTickets = [];
    window.currentTickets = currentTickets;
    
    // ---------- Update Display ----------
    function updateTicketsDisplay() {
        if (currentTicketsDisplay) {
            currentTicketsDisplay.innerHTML = currentTickets.map(t => 
                '<span class="ticket">#' + t + '</span>'
            ).join('');
        }
        if (currentTicketsCount) {
            currentTicketsCount.textContent = currentTickets.length;
        }
        if (singleList) {
            singleList.innerHTML = currentTickets.map(t => 
                '<span class="ticket">#' + t + '</span>'
            ).join('');
        }
        if (drawBtn) {
            drawBtn.disabled = currentTickets.length === 0;
        }
        window.currentTickets = currentTickets;
    }
    
    // ---------- Load Tickets ----------
    async function loadTickets() {
        try {
            const response = await fetch('/api/lottery/tickets');
            const data = await response.json();
            if (data.success && data.tickets) {
                currentTickets = data.tickets;
                window.currentTickets = currentTickets;
                updateTicketsDisplay();
                console.log('Tickets loaded:', currentTickets);
            }
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    }
    
    // ---------- Draw Lottery ----------
    async function drawLottery() {
        if (drawBtn) {
            drawBtn.disabled = true;
            drawBtn.textContent = 'Drawing...';
        }
        
        if (errorDiv) errorDiv.classList.add('hidden');
        if (resultsDiv) resultsDiv.classList.add('hidden');
        
        // Get tickets from DOM
        const ticketElements = document.querySelectorAll('#currentTicketsDisplay .ticket');
        if (ticketElements.length > 0) {
            currentTickets = Array.from(ticketElements).map(function(el) {
                return parseInt(el.textContent.replace('#', ''));
            }).filter(function(n) { return !isNaN(n); });
            window.currentTickets = currentTickets;
        }
        
        console.log('Drawing with tickets:', currentTickets);
        
        if (currentTickets.length === 0) {
            showError('No tickets available. Please add tickets first.');
            if (drawBtn) {
                drawBtn.disabled = false;
                drawBtn.textContent = 'Draw';
            }
            return;
        }
        
        try {
            const response = await fetch('/api/lottery/draw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    block_count: 3,
                    tickets: currentTickets 
                })
            });
            
            const data = await response.json();
            console.log('Draw response:', data);
            
            if (data.success) {
                const result = data.result || data;
                displayResults(result);
            } else {
                showError(data.error || 'Draw failed');
            }
        } catch (error) {
            console.error('Draw error:', error);
            showError('Connection error: ' + error.message);
        } finally {
            if (drawBtn) {
                drawBtn.disabled = false;
                drawBtn.textContent = 'Draw';
            }
        }
    }
    
    // ---------- Display Results ----------
    function displayResults(result) {
        if (winnerDisplay) {
            winnerDisplay.textContent = '#' + result.winner;
        }
        if (seedDisplay) {
            seedDisplay.textContent = result.seed_hex || 'N/A';
        }
        if (blockHashes && result.block_hashes) {
            blockHashes.innerHTML = result.block_hashes.map(function(h, i) {
                return '<div style="margin:4px 0;font-size:12px;">Block ' + (i+1) + ': <code style="word-break:break-all;">' + h + '</code></div>';
            }).join('');
        }
        if (ticketsList && result.scores) {
            var scores = result.scores;
            var sorted = Object.entries(scores).sort(function(a, b) {
                return parseInt(a[1]) - parseInt(b[1]);
            });
            
            ticketsList.innerHTML = sorted.map(function(item, index) {
                var ticket = item[0];
                var score = item[1];
                var isWinner = ticket == result.winner;
                var medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                return '<div class="score-item ' + (isWinner ? 'winner' : '') + '" style="display:flex;justify-content:space-between;padding:6px 12px;background:' + (isWinner ? 'var(--accent)' : 'var(--bg-secondary)') + ';border-radius:6px;margin:2px 0;color:' + (isWinner ? 'var(--bg-primary)' : 'var(--text-primary)') + ';">' +
                    '<span class="ticket-num">' + medal + ' #' + ticket + (isWinner ? ' 🏆' : '') + '</span>' +
                    '<span class="score-val" style="font-family:monospace;font-size:11px;">' + score + '</span>' +
                '</div>';
            }).join('');
        }
        if (proofData) {
            proofData.textContent = JSON.stringify(result, null, 2);
        }
        if (resultsDiv) {
            resultsDiv.classList.remove('hidden');
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = '❌ ' + message;
            errorDiv.classList.remove('hidden');
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // ---------- Add Single Ticket ----------
    var addBtn = document.getElementById('addSingleTicketBtn');
    var singleInput = document.getElementById('singleTicketInput');
    
    if (addBtn && singleInput) {
        addBtn.addEventListener('click', function() {
            var value = singleInput.value.trim();
            if (value) {
                var num = parseInt(value);
                if (!isNaN(num) && !currentTickets.includes(num)) {
                    currentTickets.push(num);
                    currentTickets.sort(function(a, b) { return a - b; });
                    window.currentTickets = currentTickets;
                    updateTicketsDisplay();
                    singleInput.value = '';
                    console.log('Added ticket:', num, 'Total:', currentTickets);
                }
            }
        });
        
        singleInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addBtn.click();
        });
    }
    
    // ---------- Bulk Parse ----------
    var parseBtn = document.getElementById('parseBulkTicketsBtn');
    var bulkInput = document.getElementById('bulkTicketsInput');
    
    if (parseBtn && bulkInput) {
        parseBtn.addEventListener('click', function() {
            var text = bulkInput.value;
            var numbers = text
                .split(/[,;\n\r]+/)
                .map(function(s) { return s.trim(); })
                .filter(function(s) { return s; })
                .map(function(s) { return parseInt(s); })
                .filter(function(n) { return !isNaN(n); });
            
            if (numbers.length > 0) {
                numbers.forEach(function(n) {
                    if (!currentTickets.includes(n)) {
                        currentTickets.push(n);
                    }
                });
                currentTickets.sort(function(a, b) { return a - b; });
                window.currentTickets = currentTickets;
                updateTicketsDisplay();
                if (bulkList) {
                    bulkList.innerHTML = numbers.map(function(n) {
                        return '<span class="ticket">#' + n + '</span>';
                    }).join('');
                }
                bulkInput.value = '';
                console.log('Added bulk tickets:', numbers, 'Total:', currentTickets);
            }
        });
    }
    
    // ---------- Clear All ----------
    var clearBtn = document.getElementById('clearAllCurrentBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (currentTickets.length > 0 && confirm('Clear all tickets?')) {
                currentTickets = [];
                window.currentTickets = currentTickets;
                updateTicketsDisplay();
                if (singleList) singleList.innerHTML = '';
                if (bulkList) bulkList.innerHTML = '';
                console.log('All tickets cleared');
            }
        });
    }
    
    // ---------- Draw Button ----------
    if (drawBtn) {
        drawBtn.addEventListener('click', drawLottery);
    }
    
    // ---------- Copy Proof ----------
    if (copyProofBtn) {
        copyProofBtn.addEventListener('click', function() {
            if (proofData && proofData.textContent) {
                navigator.clipboard.writeText(proofData.textContent)
                    .then(function() {
                        this.textContent = 'Copied!';
                        setTimeout(function() { this.textContent = 'Copy'; }.bind(this), 2000);
                    }.bind(this))
                    .catch(function() {
                        var textarea = document.createElement('textarea');
                        textarea.value = proofData.textContent;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        this.textContent = 'Copied!';
                        setTimeout(function() { this.textContent = 'Copy'; }.bind(this), 2000);
                    }.bind(this));
            }
        });
    }
    
    // ---------- Tabs ----------
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var method = this.dataset.method;
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.input-method').forEach(function(el) { el.classList.remove('active'); });
            var target = document.getElementById(method + 'InputMethod');
            if (target) target.classList.add('active');
        });
    });
    
    // ---------- Modes ----------
    var normalBtn = document.getElementById('normalModeBtn');
    var simBtn = document.getElementById('simulationModeBtn');
    var normalMode = document.getElementById('normalMode');
    var simMode = document.getElementById('simulationMode');
    
    if (normalBtn && simBtn) {
        normalBtn.addEventListener('click', function() {
            this.classList.add('active');
            simBtn.classList.remove('active');
            if (normalMode) normalMode.classList.remove('hidden');
            if (simMode) simMode.classList.add('hidden');
        });
        simBtn.addEventListener('click', function() {
            this.classList.add('active');
            normalBtn.classList.remove('active');
            if (simMode) simMode.classList.remove('hidden');
            if (normalMode) normalMode.classList.add('hidden');
        });
    }
    
    // ---------- Init ----------
    loadTickets();
    
    console.log('App initialized');
});
