"""
Unit tests for lottery core
"""
import unittest
import hashlib
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lottery_core import generate_seed, compute_score, pick_winner

class TestLotteryCore(unittest.TestCase):
    def test_generate_seed(self):
        block_hashes = ['a', 'b', 'c']
        seed = generate_seed(block_hashes)
        self.assertEqual(len(seed), 32)
        self.assertIsInstance(seed, bytes)
    
    def test_generate_seed_deterministic(self):
        block_hashes = ['a', 'b', 'c']
        seed1 = generate_seed(block_hashes)
        seed2 = generate_seed(block_hashes)
        self.assertEqual(seed1, seed2)
    
    def test_compute_score(self):
        seed = b'\x00' * 32
        score1 = compute_score(seed, '1')
        score2 = compute_score(seed, '2')
        self.assertNotEqual(score1, score2)
        self.assertIsInstance(score1, int)
        self.assertGreater(score1, 0)
    
    def test_pick_winner(self):
        seed_hex = '0' * 64
        tickets = ['1', '2', '3', '4', '5']
        winner, scores, proof = pick_winner(seed_hex, tickets)
        
        self.assertIn(winner, tickets)
        self.assertEqual(len(scores), len(tickets))
        self.assertEqual(scores[winner], min(scores.values()))
        self.assertIn('seed_hex', proof)
        self.assertIn('scores', proof)

if __name__ == '__main__':
    unittest.main()
