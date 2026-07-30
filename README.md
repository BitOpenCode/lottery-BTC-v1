# BTC Lottery

[![Live Demo](https://img.shields.io/badge/Live_Demo-vercel-green)](https://lottery-btc-v1.vercel.app/)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.0.0-green.svg)
![Bitcoin](https://img.shields.io/badge/Bitcoin-Enabled-orange.svg)

> Fair and verifiable lottery system based on Bitcoin block hashes

## Live Demo

[https://lottery-btc-v1.vercel.app/](https://lottery-btc-v1.vercel.app/)

---

## Description

BTC Lottery is a fully transparent and verifiable lottery system that uses **Bitcoin block hashes** as a source of randomness. No need to trust the organizer — the math guarantees fairness.

### Why is it fair?

- **Unpredictable** — Bitcoin block hashes cannot be predicted in advance
- **Immutable** — Blockchain data cannot be changed after block creation
- **Verifiable** — Anyone can independently verify the results
- **Deterministic** — Same inputs always produce the same output

### Features

- **Bitcoin-Powered** — Uses real Bitcoin block hashes as randomness
- **Verifiable** — Anyone can check results using public blockchain data
- **Transparent** — All data is public and auditable
- **Cryptographically Secure** — SHA256 ensures uniform distribution
- **Modern UI** — Dark theme with Cyber Card design, mobile-first
- **Simulation Mode** — Test with bots before real draws

---

## How It Works

### The Algorithm

**Step 1: Get Bitcoin Blocks**
The system fetches the latest 3 block hashes from the Bitcoin blockchain.

**Step 2: Generate Seed**
```python
seed = SHA256(block_hash_1 + block_hash_2 + block_hash_3)
```

**Step 3: Calculate Scores**
For each ticket:
```python
score = SHA256(seed + ":" + ticket_number)
```

**Step 4: Select Winner**
The ticket with the **minimum score** wins.

### Why It's Verifiable

Anyone can verify the result independently:
1. Get the block hashes from the blockchain explorer
2. Calculate the seed using SHA256
3. Calculate scores for all tickets
4. Confirm the winner has the minimum score

---

## Quick Start

### Prerequisites
- Python 3.8+
- pip

### Installation

```bash
# Clone repository
git clone https://github.com/BitOpenCode/lottery-BTC-v1.git
cd lottery-BTC-v1

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```

Open **http://localhost:8080** in your browser.

### 🐳 Using Docker

```bash
docker build -t btc-lottery .
docker run -p 5000:5000 btc-lottery
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/lottery/draw` | Conduct a lottery draw |
| `GET` | `/api/lottery/tickets` | Get all tickets |
| `POST` | `/api/lottery/verify` | Verify a result |
| `GET` | `/api/bitcoin/latest` | Get latest block info |
| `GET` | `/health` | Health check |

### Example API Call

```bash
# Conduct a draw with tickets 1-10
curl -X POST http://localhost:8080/api/lottery/draw \
  -H "Content-Type: application/json" \
  -d '{"tickets": [1,2,3,4,5,6,7,8,9,10]}'

# Get tickets
curl http://localhost:8080/api/lottery/tickets

# Verify result
curl -X POST http://localhost:8080/api/lottery/verify \
  -H "Content-Type: application/json" \
  -d '{
    "seed_hex": "YOUR_SEED_HERE",
    "tickets": [1,2,3,4,5,6,7,8,9,10],
    "claimed_winner": "6"
  }'
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Backend | Python 3.8+ / Flask 3.0 |
| Frontend | HTML5 / CSS3 / JavaScript |
| Blockchain | Bitcoin (Blockstream API) |
| Database | SQLite / JSON |
| Testing | Python unittest |
| Deployment | Docker / Vercel / Render |

---

## Project Structure

```
lottery-BTC-v1/
├── app.py              # Flask API server
├── lottery_core.py     # Core lottery logic (SHA256, scores, winner)
├── bitcoin_api.py      # Bitcoin blockchain integration
├── config.py           # Configuration settings
├── logger.py           # Logging setup
├── models.py           # Database models (SQLAlchemy)
├── requirements.txt    # Python dependencies
├── tickets.json        # Ticket storage
├── Makefile            # Utility commands
├── README.md           # Documentation
├── LICENSE             # MIT License
├── static/
│   ├── css/
│   │   └── style.css   # Styles with Cyber Card design
│   └── js/
│       ├── app.js      # Main frontend logic
│       ├── lottery-client.js  # API client
│       └── simulation.js      # Simulation mode
├── templates/
│   └── index.html      # Main page template
└── tests/
    └── test_core.py    # Unit tests
```

---

## Testing

```bash
# Run all tests
python -m unittest discover tests -v

# Run specific test
python -m unittest tests.test_core
```

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Deploy

### Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect repository
5. Build Command: `pip install -r requirements.txt`
6. Start Command: `python app.py`

---

## License

This project is MIT licensed. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [Blockstream API](https://blockstream.info/api/) — Free Bitcoin blockchain data
- [Flask](https://flask.palletsprojects.com/) — Web framework
- [Bitcoin](https://bitcoin.org/) — The blockchain
