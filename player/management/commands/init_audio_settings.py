from django.core.management.base import BaseCommand
from player.models import AudioSettings


class Command(BaseCommand):
    help = "Initialize AudioSettings with default values"

    def handle(self, *args, **options):
        """Initialize AudioSettings singleton"""
        audio_settings = AudioSettings.get_instance()

        self.stdout.write(
            self.style.SUCCESS(
                f"AudioSettings initialized: {audio_settings.lecture_title} "
                f"({audio_settings.audio_file_path})"
            )
        )

        if not audio_settings.audio_file_exists():
            self.stdout.write(
                self.style.WARNING(
                    f"Warning: Audio file does not exist at {audio_settings.get_full_audio_path()}"
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS("Audio file exists and is accessible"))
