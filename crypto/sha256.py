from time import perf_counter_ns


ROUND_CONSTANTS = (
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
    0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
    0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
    0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
    0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
    0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
)

INITIAL_STATE = (
    0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
    0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19,
)
MASK_32 = 0xFFFFFFFF


def rotate_right(value: int, amount: int) -> int:
    return ((value >> amount) | (value << (32 - amount))) & MASK_32


def sha256(data: bytes) -> bytes:
    bit_length = len(data) * 8
    padded = bytearray(data)
    padded.append(0x80)
    padded.extend(b"\x00" * ((56 - len(padded) % 64) % 64))
    padded.extend(bit_length.to_bytes(8, "big"))

    state = list(INITIAL_STATE)
    for block_offset in range(0, len(padded), 64):
        block = padded[block_offset : block_offset + 64]
        words = [
            int.from_bytes(block[offset : offset + 4], "big")
            for offset in range(0, 64, 4)
        ]

        for index in range(16, 64):
            sigma_zero = (
                rotate_right(words[index - 15], 7)
                ^ rotate_right(words[index - 15], 18)
                ^ (words[index - 15] >> 3)
            )
            sigma_one = (
                rotate_right(words[index - 2], 17)
                ^ rotate_right(words[index - 2], 19)
                ^ (words[index - 2] >> 10)
            )
            words.append(
                (words[index - 16] + sigma_zero + words[index - 7] + sigma_one)
                & MASK_32
            )

        a, b, c, d, e, f, g, h = state
        for index in range(64):
            upper_sigma_e = (
                rotate_right(e, 6) ^ rotate_right(e, 11) ^ rotate_right(e, 25)
            )
            choose = (e & f) ^ (~e & g)
            temp_one = (
                h + upper_sigma_e + choose + ROUND_CONSTANTS[index] + words[index]
            ) & MASK_32
            upper_sigma_a = (
                rotate_right(a, 2) ^ rotate_right(a, 13) ^ rotate_right(a, 22)
            )
            majority = (a & b) ^ (a & c) ^ (b & c)
            temp_two = (upper_sigma_a + majority) & MASK_32

            h, g, f, e = g, f, e, (d + temp_one) & MASK_32
            d, c, b, a = c, b, a, (temp_one + temp_two) & MASK_32

        state = [
            (current + updated) & MASK_32
            for current, updated in zip(state, (a, b, c, d, e, f, g, h))
        ]

    return b"".join(word.to_bytes(4, "big") for word in state)


def run(input_text: str) -> dict[str, object]:
    start = perf_counter_ns()
    message = input_text.encode("utf-8")
    digest = sha256(message)
    elapsed_ms = (perf_counter_ns() - start) / 1_000_000
    block_count = (len(message) + 9 + 63) // 64

    return {
        "output": digest.hex(),
        "algorithm": "SHA-256, implemented with 32-bit operations and 64 compression rounds per block",
        "execution_time_ms": f"{elapsed_ms:.4f} ms",
        "details": [
            f"UTF-8 input: {len(message)} bytes",
            f"Message padded and processed in {block_count} 512-bit block(s).",
            "Each block expands 16 input words into a 64-word schedule.",
            "Eight 32-bit state words are updated by the compression rounds.",
        ],
        "note": "SHA-256 is a one-way hash, not encryption. This educational implementation is not a substitute for a vetted cryptographic library.",
    }
