from django.db import models
from django.core.exceptions import ValidationError
import os
from django.conf import settings


class AudioSettings(models.Model):
    """
    Singleton model for managing audio file settings.
    Only one instance should exist in the database.
    """

    lecture_title = models.CharField(
        max_length=200, default="講演音声", help_text="講演のタイトル"
    )
    audio_file_path = models.CharField(
        max_length=500,
        default="audio/lecture.mp3",
        help_text="音声ファイルのパス（media/からの相対パス）",
    )
    duration = models.FloatField(default=0, help_text="音声ファイルの長さ（秒）")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "音声設定"
        verbose_name_plural = "音声設定"

    def save(self, *args, **kwargs):
        """
        Singleton pattern implementation - ensure only one instance exists
        """
        if not self.pk and AudioSettings.objects.exists():
            # If this is a new instance and one already exists, update the existing one
            existing = AudioSettings.objects.first()
            existing.lecture_title = self.lecture_title
            existing.audio_file_path = self.audio_file_path
            existing.duration = self.duration
            existing.save()
            return existing
        return super().save(*args, **kwargs)

    def clean(self):
        """
        Validate that the audio file exists
        """
        super().clean()
        if self.audio_file_path:
            full_path = os.path.join(settings.MEDIA_ROOT, self.audio_file_path)
            if not os.path.exists(full_path):
                raise ValidationError(
                    {"audio_file_path": f"音声ファイルが見つかりません: {full_path}"}
                )

    @classmethod
    def get_instance(cls):
        """
        Get the singleton instance, create if doesn't exist
        """
        instance, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                "lecture_title": "講演音声",
                "audio_file_path": "audio/lecture.mp3",
                "duration": 0,
            },
        )
        return instance

    def get_full_audio_path(self):
        """
        Get the full filesystem path to the audio file
        """
        return os.path.join(settings.MEDIA_ROOT, self.audio_file_path)

    def audio_file_exists(self):
        """
        Check if the audio file exists on the filesystem
        """
        return os.path.exists(self.get_full_audio_path())

    def get_audio_url(self):
        """
        Get the URL for accessing the audio file
        """
        return f"{settings.MEDIA_URL}{self.audio_file_path}"

    def __str__(self):
        return f"{self.lecture_title} ({self.audio_file_path})"
