#!/usr/bin/env python3
"""
Pre-record the app's narration with Kokoro-82M (Apache-2.0), voice af_heart.

  npx tsx scripts/export-narration.ts > narration.json
  python3 scripts/render-voice.py narration.json <kokoro model.onnx> <voices.npz> public/voice [--prune]

Writes public/voice/<key>.mp3 (mono, loudness-normalised) and public/voice/manifest.json.
Requires: pip install kokoro-onnx soundfile ; ffmpeg on PATH. Only renders missing files.
--prune deletes recordings that are no longer narrated.
"""
import json, os, re, subprocess, sys, tempfile

import soundfile as sf
from kokoro_onnx import Kokoro

VOICE, SPEED = "af_heart", 0.95
ARTICLE_NOUNS = {"third", "triad", "seventh", "sixth", "second", "chord", "scale", "key", "mode", "note"}


def fix_note_a(text: str) -> str:
    """The note 'A' must be read 'ay', not the article 'uh'. 'Eigh' phonemizes to /eɪ/."""
    text = text.replace("A A' B A", "Eigh, Eigh prime, B, Eigh")

    def repl(m: re.Match) -> str:
        before, after = m.string[: m.start()], m.string[m.end():]
        nxt = re.match(r"\s*([\w']+|[,.;:!?])", after)
        w = nxt.group(1) if nxt else ""
        sentence_start = before.strip() == "" or before.rstrip()[-1:] in ".!?:"
        if w in ("", ",", ".", ";", ":", "to", "and", "feels", "B", "or"):
            return "Eigh"
        if w in ("minor", "major"):
            nxt2 = re.match(r"\s*\w+\s*([\w']+|[,.;:!?])", after)
            return "A" if (nxt2 and nxt2.group(1) in ARTICLE_NOUNS) else "Eigh"
        if w in ("sharp", "flat"):
            return "A" if sentence_start else "Eigh"
        return "A"

    return re.sub(r"\bA\b", repl, text)


def main():
    src, model, voices, out = sys.argv[1:5]
    os.makedirs(out, exist_ok=True)
    lines = json.load(open(src))
    kokoro = Kokoro(model, voices)
    manifest_path = os.path.join(out, "manifest.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    for i, line in enumerate(lines):
        key, text = line["key"], line["text"]
        mp3 = os.path.join(out, f"{key}.mp3")
        if key in manifest and os.path.exists(mp3):
            continue
        samples, sr = kokoro.create(fix_note_a(text), voice=VOICE, speed=SPEED, lang="en-us")
        with tempfile.NamedTemporaryFile(suffix=".wav") as wav:
            sf.write(wav.name, samples, sr)
            subprocess.run(
                ["ffmpeg", "-loglevel", "error", "-y", "-i", wav.name, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11,apad=pad_dur=0.15", "-ac", "1", "-ar", "24000", "-b:a", "40k", mp3],
                check=True,
            )
        manifest[key] = round(len(samples) / sr, 2)
        if i % 10 == 0:
            json.dump(manifest, open(manifest_path, "w"))
            print(f"{i + 1}/{len(lines)}", flush=True)
    if "--prune" in sys.argv:
        wanted = {line["key"] for line in lines}
        for key in [k for k in manifest if k not in wanted]:
            manifest.pop(key)
            try:
                os.remove(os.path.join(out, f"{key}.mp3"))
            except FileNotFoundError:
                pass
    json.dump(manifest, open(manifest_path, "w"), sort_keys=True)
    print("done", len(manifest))


if __name__ == "__main__":
    main()
