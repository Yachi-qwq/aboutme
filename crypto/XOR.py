from time import perf_counter_ns

BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"


def manual_base64_encode(data: bytes) -> str:
    """Encode raw bytes without a Base64 library."""
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


def run(input_text: str, key_text: str) -> dict[str, object]:
    if not key_text:
        raise ValueError("Enter a non-empty XOR key.")

    start = perf_counter_ns()
    plaintext = input_text.encode("utf-8")
    key = key_text.encode("utf-8")
    ciphertext = bytearray(len(plaintext))
    bit_steps = []

    for index, plain_byte in enumerate(plaintext):
        key_byte = key[index % len(key)]
        cipher_byte = plain_byte ^ key_byte
        ciphertext[index] = cipher_byte
        if index < 5:
            bit_steps.append(
                f"byte[{index}]: {plain_byte:08b} XOR {key_byte:08b} "
                f"= {cipher_byte:08b} (0x{cipher_byte:02X})"
            )

    encoded_ciphertext = manual_base64_encode(ciphertext)
    elapsed_ms = (perf_counter_ns() - start) / 1_000_000
    return {
        "output": encoded_ciphertext,
        "algorithm": "Repeating-key XOR over UTF-8 bytes + manual Base64",
        "execution_time_ms": f"{elapsed_ms:.4f} ms",
        "details": [
            f"Plaintext: {len(plaintext)} byte(s); repeating key: {len(key)} byte(s).",
            "For each position i: ciphertext[i] = plaintext[i] XOR key[i modulo key length].",
            "The same key bytes repeat when the message is longer than the key.",
            "Base64 makes the binary ciphertext printable; it is not encryption.",
            *bit_steps,
        ],
        "note": "Repeating-key XOR is an educational demonstration, not secure encryption. Repeated key patterns leak information.",
    }