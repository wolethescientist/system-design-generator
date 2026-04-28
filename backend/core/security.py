import hashlib
import os

def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        salt, 
        100000
    )
    return salt.hex() + ":" + key.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt_hex, key_hex = hashed_password.split(':')
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac(
            'sha256', 
            plain_password.encode('utf-8'), 
            salt, 
            100000
        )
        return key.hex() == key_hex
    except Exception:
        return False
