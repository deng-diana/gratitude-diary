import os
import sys
import unittest

from fastapi import HTTPException


CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.utils.transcription import (  # noqa: E402
    normalize_transcription,
    validate_audio_quality,
    validate_transcription,
)


class TranscriptionUtilsTests(unittest.TestCase):
    def test_normalize_transcription_strips_punctuation_and_whitespace(self):
        self.assertEqual(normalize_transcription("  Hello, 世界! "), "Hello世界")

    def test_validate_transcription_rejects_empty(self):
        with self.assertRaises(HTTPException) as ctx:
            validate_transcription("...   ")
        self.assertEqual(ctx.exception.status_code, 400)

    def test_validate_transcription_allows_short_filler_if_duration_ok(self):
        try:
            validate_transcription("um uh hmm", duration=8)
        except HTTPException as exc:
            self.fail(f"Unexpected HTTPException: {exc.detail}")

    def test_validate_transcription_accepts_meaningful_text(self):
        try:
            validate_transcription("今天我很开心，天气很好", duration=8)
        except HTTPException as exc:
            self.fail(f"Unexpected HTTPException: {exc.detail}")

    def test_validate_audio_quality_rejects_short(self):
        with self.assertRaises(HTTPException):
            validate_audio_quality(duration=3, audio_size=5000)

    def test_validate_audio_quality_rejects_too_long(self):
        with self.assertRaises(HTTPException):
            validate_audio_quality(duration=601, audio_size=5000)

    def test_validate_audio_quality_rejects_too_small(self):
        with self.assertRaises(HTTPException):
            validate_audio_quality(duration=10, audio_size=500)

    def test_validate_audio_quality_accepts_ok(self):
        try:
            validate_audio_quality(duration=10, audio_size=5000)
        except HTTPException as exc:
            self.fail(f"Unexpected HTTPException: {exc.detail}")


if __name__ == "__main__":
    unittest.main()
