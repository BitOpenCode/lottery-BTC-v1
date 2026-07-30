"""
Bitcoin API - Integration with Bitcoin blockchain
Gets real Bitcoin block hashes using public API
"""
import requests
from typing import List, Optional, Tuple

API_BASE = "https://blockstream.info/api"

def get_block_hash_by_height(height: int) -> Optional[str]:
    """
    Get block hash by height using public API
    
    Args:
        height: Block height
        
    Returns:
        str: Block hash or None on error
    """
    try:
        url = f"{API_BASE}/block-height/{height}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text.strip()
    except Exception as e:
        print(f"Error getting block {height}: {e}")
        return None

def get_latest_block_hash() -> Optional[str]:
    """
    Get latest Bitcoin block hash
    
    Returns:
        str: Latest block hash or None on error
    """
    try:
        height = get_latest_block_height()
        if height:
            return get_block_hash_by_height(height)
        return None
    except Exception as e:
        print(f"Error getting latest block: {e}")
        return None

def get_latest_block_height() -> Optional[int]:
    """
    Get latest Bitcoin block height
    
    Returns:
        int: Block height or None on error
    """
    try:
        url = f"{API_BASE}/blocks/tip/height"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return int(response.text.strip())
    except Exception as e:
        print(f"Error getting block height: {e}")
        return None

def get_block_hashes_for_draw(draw_block_height: Optional[int] = None, count: int = 3) -> Tuple[List[str], List[int]]:
    """
    Get block hashes for lottery draw
    
    Args:
        draw_block_height: Block height for draw (if None - latest block)
        count: Number of blocks to use (default 3)
        
    Returns:
        tuple[List[str], List[int]]: Tuple (list of block hashes, list of block heights)
    """
    if draw_block_height is None:
        latest_height = get_latest_block_height()
        if latest_height is None:
            raise Exception("Could not get latest block height")
        draw_block_height = latest_height
    
    hashes = []
    heights = []
    
    for i in range(count):
        height = draw_block_height - i
        block_hash = get_block_hash_by_height(height)
        if block_hash is None:
            raise Exception(f"Could not get block {height}")
        hashes.append(block_hash)
        heights.append(height)
    
    return hashes, heights

if __name__ == "__main__":
    # Test getting Bitcoin blocks
    print("Getting latest Bitcoin blocks...")
    try:
        hashes, heights = get_block_hashes_for_draw(count=3)
        print(f"Got {len(hashes)} blocks:")
        for i, (h, height) in enumerate(zip(hashes, heights)):
            print(f"  Block #{height}: {h}")
    except Exception as e:
        print(f"Error: {e}")
