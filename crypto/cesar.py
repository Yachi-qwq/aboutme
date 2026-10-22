from time import perf_counter_ns


def run(input_text: str) -> dict[str, object]:
    start = perf_counter_ns()
    shift = 3
    transformed = []
    trace = []

    for character in input_text:
        if "a" <= character <= "z":
            result = chr((ord(character) - ord("a") + shift) % 26 + ord("a"))
        elif "A" <= character <= "Z":
            result = chr((ord(character) - ord("A") + shift) % 26 + ord("A"))
        else:
            result = character

        transformed.append(result)
        if len(trace) < 5:
            trace.append(f"{character!r} -> {result!r}")

    elapsed_ms = (perf_counter_ns() - start) / 1_000_000
    return {
        "output": "".join(transformed),
        "algorithm": f"Caesar substitution, alphabet rotation = {shift}",
        "execution_time_ms": f"{elapsed_ms:.4f} ms",
        "details": [
            "Each ASCII letter is mapped to an index from 0 to 25.",
            "The shift is added modulo 26; non-ASCII letters and punctuation are preserved.",
            *trace,
        ],
        "note": "A Caesar cipher has only 25 useful shifts and is not secure encryption.",
    }
