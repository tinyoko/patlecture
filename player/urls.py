from django.urls import path
from . import views

app_name = "player"

urlpatterns = [
    path("", views.audio_player_view, name="audio_player"),
    path("audio/output.mp3", views.AudioFileView.as_view(), name="audio_file"),
]
