import hashlib
import secrets
from time import perf_counter_ns


# RFC 3526, 2048-bit MODP group 14. This is a public group, not a secret.
MODULUS = int(
    "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1"
    "29024E088A67CC74020BBEA63B139B22514A08798E3404DD"
    "EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245"
    "E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED"
    "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D"
    "C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F"
    "83655D23DCA3AD961C62F356208552BB9ED529077096966D"
    "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B"
    "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9"
    "DE2BCBF6955817183995497CEA956AE515D2261898FA0510"
    "15728E5A8AACAA68FFFFFFFFFFFFFFFF",
    16,
)
GENERATOR = 2


def run() -> dict[str, object]:
    start = perf_counter_ns()

    # Simulate two parties choosing independent ephemeral private exponents.
    private_a = secrets.randbelow(MODULUS - 3) + 2
    private_b = secrets.randbelow(MODULUS - 3) + 2

    # Public values are exchanged; each party computes the same shared value.
    public_a = pow(GENERATOR, private_a, MODULUS)
    public_b = pow(GENERATOR, private_b, MODULUS)
    shared_a = pow(public_b, private_a, MODULUS)
    shared_b = pow(public_a, private_b, MODULUS)
    if shared_a != shared_b:
        raise ArithmeticError("The two parties computed different shared values.")

    shared_bytes = shared_a.to_bytes((shared_a.bit_length() + 7) // 8, "big")
    fingerprint = hashlib.sha256(shared_bytes).hexdigest()
    elapsed_ms = (perf_counter_ns() - start) / 1_000_000
    return {
        "output": (
            "Party A public value (hex):\n"
            f"{public_a:0{MODULUS.bit_length() // 4}x}\n\n"
            "Party B public value (hex):\n"
            f"{public_b:0{MODULUS.bit_length() // 4}x}\n\n"
            f"Shared value matches: {shared_a == shared_b}\n"
            f"Shared-value SHA-256 fingerprint: {fingerprint}"
        ),
        "algorithm": "Diffie-Hellman over RFC 3526 2048-bit MODP group 14",
        "execution_time_ms": f"{elapsed_ms:.4f} ms",
        "details": [
            f"Public modulus size: {MODULUS.bit_length()} bits; generator g = {GENERATOR}.",
            "Private exponents are independently sampled with secrets.randbelow().",
            "A publishes A = g^a mod p; B publishes B = g^b mod p.",
            "A computes B^a mod p; B computes A^b mod p.",
            "The shared value is not displayed; only its SHA-256 fingerprint is shown.",
            "This standalone demo does not authenticate either party and is vulnerable to man-in-the-middle attacks.",
            f"Public values are shown as {MODULUS.bit_length() // 4}-character hexadecimal integers.",
        ],
        "note": "Diffie-Hellman establishes a shared value; it does not encrypt or authenticate messages by itself. This demonstration is not a production key exchange.",
    }
