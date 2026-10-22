import secrets
from time import perf_counter_ns


BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"


def manual_base64_encode(data: bytes) -> str:
    """Encode bytes in Base64 by packing each 3-byte group into 4 sextets."""
    encoded = []
    for offset in range(0, len(data), 3):
        chunk = data[offset : offset + 3]
        packed = int.from_bytes(chunk, "big") << (8 * (3 - len(chunk)))
        encoded.extend(
            BASE64_ALPHABET[(packed >> shift) & 0x3F]
            for shift in (18, 12, 6, 0)
        )
        if len(chunk) < 3:
            encoded[-(3 - len(chunk)) :] = "=" * (3 - len(chunk))

    return "".join(encoded)


def run(input_text: str) -> dict[str, object]:
    start = perf_counter_ns()
    plaintext = input_text.encode("utf-8")
    key = secrets.token_bytes(len(plaintext))
    ciphertext = bytearray(len(plaintext))
    bit_steps = []

    for index, (plain_byte, key_byte) in enumerate(zip(plaintext, key)):
        cipher_byte = plain_byte ^ key_byte
        ciphertext[index] = cipher_byte
        if index < 5:
            bit_steps.append(
                f"byte[{index}]: {plain_byte:08b} XOR {key_byte:08b} "
                f"= {cipher_byte:08b} (0x{cipher_byte:02X})"
            )

    encoded_ciphertext = manual_base64_encode(ciphertext)
    encoded_key = manual_base64_encode(key)
    elapsed_ms = (perf_counter_ns() - start) / 1_000_000

    return {
        "output": encoded_ciphertext,
        "key": encoded_key,
        "algorithm": "One-Time Pad: cryptographic random key + byte-wise XOR + manual Base64",
        "execution_time_ms": f"{elapsed_ms:.4f} ms",
        "details": [
            f"UTF-8 plaintext length: {len(plaintext)} byte(s); key length: {len(key)} byte(s).",
            "Key bytes come from Python's operating-system-backed secrets module.",
            "The key is as long as this message and must never be reused.",
            "Base64 is only a text representation; it does not add encryption.",
            "An LCG seeded from time is predictable and is deliberately not used for OTP keys.",
            *bit_steps,
        ],
        "note": "Demonstration only: this page reveals the key. A real one-time pad requires a truly random, secret, equal-length key that is never reused.",
    }
