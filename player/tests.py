from django.test import TestCase, Client
from django.urls import reverse
from .models import AudioSettings


class WaveSurferAudioPlayerTest(TestCase):
    """Test the WaveSurfer.js audio player implementation"""

    def setUp(self):
        """Set up test data"""
        self.client = Client()
        # Ensure AudioSettings exists
        AudioSettings.get_instance()

    def test_audio_player_page_loads(self):
        """Test that the main audio player page loads successfully"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "WaveSurfer.js")
        self.assertContains(response, "audio-player.js")
        self.assertContains(response, "waveform")

    def test_audio_player_controls_present(self):
        """Test that audio player controls are present in the template"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

        # Check for essential player controls
        self.assertContains(response, "play-btn")
        self.assertContains(response, "pause-btn")
        self.assertContains(response, "volume-slider")
        self.assertContains(response, "current-time")
        self.assertContains(response, "total-time")

    def test_wavesurfer_configuration(self):
        """Test that WaveSurfer.js configuration is present"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)

        # Check for WaveSurfer.js CDN links
        self.assertContains(response, "unpkg.com/wavesurfer.js@6")
        self.assertContains(response, "wavesurfer.regions.min.js")

    def test_audio_settings_model(self):
        """Test AudioSettings model functionality"""
        settings = AudioSettings.get_instance()
        self.assertIsNotNone(settings)
        self.assertEqual(settings.lecture_title, "講演音声")
        # The default might be lecture.mp3, but we can test the URL generation
        self.assertTrue(settings.audio_file_path.startswith("audio/"))

        # Test URL generation
        audio_url = settings.get_audio_url()
        self.assertTrue(audio_url.endswith(".mp3"))

    def test_javascript_classes_present(self):
        """Test that JavaScript classes are present by checking the file exists"""
        import os
        from django.conf import settings

        js_file_path = os.path.join(
            settings.BASE_DIR, "static", "js", "audio-player.js"
        )
        self.assertTrue(os.path.exists(js_file_path))

        # Read the file content and check for key classes
        with open(js_file_path, "r") as f:
            content = f.read()
            self.assertIn("class WaveSurferPlayer", content)
            self.assertIn("class AudioPlayerController", content)
            self.assertIn("initialize()", content)
            self.assertIn("loadAudio()", content)
            self.assertIn("setRegion(", content)

    def test_audio_player_api_present(self):
        """Test that the audio player API is present in the template"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "window.AudioPlayer")
        self.assertContains(response, "setTimeRange")
        self.assertContains(response, "AudioPlayerController")
