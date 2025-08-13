from django.shortcuts import render
from django.http import HttpResponse, Http404, FileResponse
from django.conf import settings
from django.views.decorators.cache import cache_control
from django.utils.decorators import method_decorator
from django.views import View
import os
import mimetypes
from .models import AudioSettings


def audio_player_view(request):
    """Main page view for the audio chat player"""
    # Get audio settings from the database
    audio_settings = AudioSettings.get_instance()

    context = {
        "lecture_title": audio_settings.lecture_title,
        "audio_file_path": audio_settings.audio_file_path,
        "audio_url": audio_settings.get_audio_url(),
        "audio_exists": audio_settings.audio_file_exists(),
    }
    return render(request, "player/audio_player.html", context)


@method_decorator(cache_control(max_age=3600), name="dispatch")
class AudioFileView(View):
    """
    View for serving audio files with proper error handling and caching
    """

    def get(self, request, *args, **kwargs):
        """
        Serve the audio file with proper headers and error handling
        """
        try:
            # Get audio settings
            audio_settings = AudioSettings.get_instance()

            # Check if file exists
            if not audio_settings.audio_file_exists():
                raise Http404("音声ファイルが見つかりません")

            # Get the full file path
            file_path = audio_settings.get_full_audio_path()

            # Determine content type
            content_type, _ = mimetypes.guess_type(file_path)
            if not content_type:
                content_type = "audio/mpeg"  # Default to MP3

            # Create file response
            response = FileResponse(
                open(file_path, "rb"), content_type=content_type, as_attachment=False
            )

            # Add headers for audio streaming
            response["Accept-Ranges"] = "bytes"
            response["Content-Length"] = os.path.getsize(file_path)

            return response

        except FileNotFoundError:
            raise Http404("音声ファイルが見つかりません")
        except Exception as e:
            # Log the error in production
            return HttpResponse(
                f"音声ファイルの読み込みでエラーが発生しました: {str(e)}", status=500
            )
