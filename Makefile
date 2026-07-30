.PHONY: help install test run clean

help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make test         - Run tests"
	@echo "  make run          - Run development server"
	@echo "  make clean        - Clean temporary files"

install:
	pip install -r requirements.txt

test:
	python -m unittest discover tests -v

run:
	python app.py

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.log" -delete 2>/dev/null || true
