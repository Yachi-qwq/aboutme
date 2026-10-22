import base64
import hashlib
from time import perf_counter_ns

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


def run(input_text: str) -> dict[str, object]:
    start = perf_counter_ns()
    message = input_text.encode("utf-8")
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    signature = private_key.sign(
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )
    private_key.public_key().verify(
        signature,
        message,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH,
        ),
        hashes.SHA256(),
    )
    public_key = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    elapsed_ms = (perf_counter_ns() - start) / 1_000_000

    return {
        "output": (
            f"Signature (Base64): {base64.b64encode(signature).decode('ascii')}\n\n"
            f"Temporary public key:\n{public_key.decode('ascii')}"
        ),
        "algorithm": "RSA-2048 + PSS padding + SHA-256 digest",
        "execution_time_ms": f"{elapsed_ms:.4f} ms",
        "details": [
            f"Message encoded as {len(message)} UTF-8 byte(s).",
            "A fresh 2048-bit RSA key pair is generated for this run.",
            f"SHA-256 message fingerprint: {hashlib.sha256(message).hexdigest()}",
            "PSS uses MGF1(SHA-256) and a maximum-length random salt.",
            "The generated signature was verified against the matching public key.",
            f"Public key size: {private_key.key_size} bits.",
        ],
        "note": "RSA-PSS creates a signature; it does not encrypt the message. The cryptography package supplies audited RSA primitives, and the temporary private key is discarded after this demonstration.",
    }
