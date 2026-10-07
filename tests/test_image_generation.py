import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('generator', Path(__file__).resolve().parents[1] / 'generate_images.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class ImageGenerationTests(unittest.TestCase):
    def test_injected_key_does_not_require_local_env_file(self):
        with patch.dict(generator.os.environ, {'GEMINI_API_KEY': 'test-only-placeholder'}):
            self.assertEqual(generator.load_api_key(), 'test-only-placeholder')

    def test_output_cannot_escape_assets_or_use_another_format(self):
        for folder, name in [('..', 'escape.png'), ('assets/images', '../../escape.png'),
                             ('/tmp', 'escape.png'), ('assets/images', 'image.jpg')]:
            with self.subTest(folder=folder, name=name), self.assertRaises(ValueError):
                generator.resolve_output(folder, name)
        self.assertEqual(generator.resolve_output('assets/images/avatars', 'test.png').suffix, '.png')

    def run_main(self, prompts, dry_run=False):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'prompts.json'
            path.write_text(json.dumps(prompts))
            argv = ['generator', '--prompts', str(path)] + (['--dry-run'] if dry_run else [])
            with patch.object(generator.sys, 'argv', argv), patch.object(generator, 'ROOT', Path(tmp)), \
                 patch.object(generator, 'load_api_key', return_value='test-only-placeholder') as key, \
                 patch.object(generator, 'generate_image', return_value=False) as generate, \
                 patch.object(generator, 'log'), patch.object(generator.time, 'sleep'), \
                 contextlib.redirect_stdout(io.StringIO()):
                result = generator.main()
                return result, key.call_count, generate.call_count

    def test_dry_run_validates_without_credentials_or_network(self):
        self.assertEqual(self.run_main([{'folder': 'assets/images', 'filename': 'test.png', 'prompt': 'test'}], True), (0, 0, 0))

    def test_empty_selection_is_a_failure(self):
        self.assertEqual(self.run_main([], True), (1, 0, 0))

    def test_failed_generation_returns_a_failing_exit_status(self):
        result, _, calls = self.run_main([{'folder': 'assets/images', 'filename': 'test.png', 'prompt': 'test'}])
        self.assertEqual(result, 1)
        self.assertEqual(calls, 1)


if __name__ == '__main__':
    unittest.main()
