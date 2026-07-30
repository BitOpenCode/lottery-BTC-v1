"""
BTC Lottery Flask API Server
Fair lottery system based on Bitcoin block hashes
"""
import hashlib
import json
import logging
import os
import time
from typing import List, Dict, Any, Optional
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from bitcoin_api import get_block_hashes_for_draw, get_latest_block_height
from lottery_core import get_lottery_result, pick_winner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Lottery history for checking block uniqueness
lottery_history: List[Dict[str, Any]] = []
MAX_HISTORY = 100
TICKETS_FILE = 'tickets.json'

def load_tickets() -> List[int]:
    """
    Load tickets from file.
    Returns empty list if file doesn't exist or is empty.
    NO HARDCODED TICKETS!
    """
    try:
        if os.path.exists(TICKETS_FILE):
            with open(TICKETS_FILE, 'r') as f:
                data = json.load(f)
                tickets = data.get('tickets', [])
                if tickets:
                    logger.info(f"Loaded {len(tickets)} tickets from file")
                    return tickets
                else:
                    logger.info("Tickets file is empty")
        else:
            logger.info("Tickets file does not exist")
    except Exception as e:
        logger.error(f"Error loading tickets: {e}")
    
    # Return empty list - NO HARDCODED TICKETS!
    return []

def save_tickets(tickets: List[int]) -> bool:
    """Save tickets to file"""
    try:
        with open(TICKETS_FILE, 'w') as f:
            json.dump({'tickets': tickets}, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving tickets: {e}")
        return False

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/lottery/draw', methods=['POST'])
def lottery_draw():
    """
    Conduct lottery draw
    
    Request body:
        "block_height": int (optional, defaults to latest block)
        "block_count": int (optional, defaults to 3)
        "tickets": [int] (optional, defaults to file)
    """
    try:
        data = request.json or {}
        block_count = data.get('block_count', 3)
        block_height = data.get('block_height')
        tickets = data.get('tickets')
        
        # Load tickets from file if not provided
        if tickets is None:
            tickets = load_tickets()
        
        if not tickets:
            return jsonify({
                'success': False,
                'error': 'No tickets available'
            }), 400
        
        # Get block hashes
        block_hashes, block_heights = get_block_hashes_for_draw(
            draw_block_height=block_height,
            count=block_count
        )
        
        # Check if these blocks were used recently
        warnings = []
        for prev_draw in lottery_history[-10:]:
            if prev_draw.get('block_heights') == block_heights:
                warnings.append({
                    'type': 'duplicate_blocks',
                    'message': f'Using same blocks as draw from {prev_draw["timestamp"]}. Result will be identical!'
                })
                break
        
        # Run lottery
        result = get_lottery_result(block_hashes, tickets, block_heights)
        result['timestamp'] = time.strftime('%Y-%m-%d %H:%M:%S')
        
        # Save to history
        lottery_history.append(result)
        if len(lottery_history) > MAX_HISTORY:
            lottery_history.pop(0)
        
        return jsonify({
            'success': True,
            'result': result,
            'warnings': warnings
        })
        
    except Exception as e:
        logger.error(f"Draw error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/lottery/tickets', methods=['GET'])
def get_tickets():
    """Return list of all tickets"""
    try:
        tickets = load_tickets()
        return jsonify({
            'success': True,
            'tickets': tickets,
            'count': len(tickets)
        })
    except Exception as e:
        logger.error(f"Error getting tickets: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/lottery/tickets', methods=['POST'])
def add_ticket():
    """Add a new ticket"""
    try:
        data = request.json
        ticket_number = data.get('ticket')
        
        if ticket_number is None:
            return jsonify({
                'success': False,
                'error': 'Ticket number not specified'
            }), 400
        
        try:
            ticket_number = int(ticket_number)
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Ticket number must be an integer'
            }), 400
        
        tickets = load_tickets()
        
        if ticket_number in tickets:
            return jsonify({
                'success': False,
                'error': f'Ticket #{ticket_number} already exists'
            }), 400
        
        tickets.append(ticket_number)
        tickets.sort()
        
        if save_tickets(tickets):
            return jsonify({
                'success': True,
                'message': f'Ticket #{ticket_number} added successfully',
                'tickets': tickets,
                'count': len(tickets)
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error saving tickets'
            }), 500
            
    except Exception as e:
        logger.error(f"Error adding ticket: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/lottery/tickets/<int:ticket_number>', methods=['DELETE'])
def remove_ticket(ticket_number):
    """Remove a ticket"""
    try:
        tickets = load_tickets()
        
        if ticket_number not in tickets:
            return jsonify({
                'success': False,
                'error': f'Ticket #{ticket_number} not found'
            }), 404
        
        tickets.remove(ticket_number)
        tickets.sort()
        
        if save_tickets(tickets):
            return jsonify({
                'success': True,
                'message': f'Ticket #{ticket_number} removed successfully',
                'tickets': tickets,
                'count': len(tickets)
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Error saving tickets'
            }), 500
            
    except Exception as e:
        logger.error(f"Error removing ticket: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/lottery/verify', methods=['POST'])
def verify_result():
    """
    Verify lottery result
    
    Request body:
        "seed_hex": str
        "tickets": [int]
        "claimed_winner": int
    """
    try:
        data = request.json
        seed_hex = data.get('seed_hex')
        tickets = data.get('tickets')
        claimed_winner = data.get('claimed_winner')
        
        if not seed_hex or not tickets:
            return jsonify({
                'success': False,
                'error': 'Insufficient data for verification'
            }), 400
        
        # Recalculate winner
        winner, scores, proof = pick_winner(seed_hex, tickets)
        is_valid = str(winner) == str(claimed_winner)
        
        return jsonify({
            'success': True,
            'valid': is_valid,
            'calculated_winner': int(winner),
            'claimed_winner': int(claimed_winner),
            'scores': {k: str(v) for k, v in scores.items()},
            'proof': proof
        })
        
    except Exception as e:
        logger.error(f"Verification error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/bitcoin/latest', methods=['GET'])
def get_latest_block():
    """Get latest Bitcoin block information"""
    try:
        height = get_latest_block_height()
        if height:
            return jsonify({
                'success': True,
                'latest_block_height': height
            })
        else:
            raise Exception("Could not get block height")
    except Exception as e:
        logger.error(f"Error getting latest block: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'BTC Lottery',
        'version': '2.0.0',
        'tickets_count': len(load_tickets()),
        'history_count': len(lottery_history)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting BTC Lottery server on port {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Tickets loaded: {len(load_tickets())}")
    
    app.run(debug=debug, host='0.0.0.0', port=port)