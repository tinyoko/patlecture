from django.contrib import admin
from .models import AudioSettings


@admin.register(AudioSettings)
class AudioSettingsAdmin(admin.ModelAdmin):
    """
    Admin interface for AudioSettings model
    """

    list_display = (
        "lecture_title",
        "audio_file_path",
        "duration",
        "audio_file_exists",
        "updated_at",
    )
    fields = ("lecture_title", "audio_file_path", "duration")
    readonly_fields = ("created_at", "updated_at")

    def audio_file_exists(self, obj):
        """Display whether the audio file exists"""
        return obj.audio_file_exists()

    audio_file_exists.boolean = True
    audio_file_exists.short_description = "ファイル存在"

    def has_add_permission(self, request):
        """Prevent adding multiple instances (singleton pattern)"""
        return not AudioSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of the singleton instance"""
        return False
