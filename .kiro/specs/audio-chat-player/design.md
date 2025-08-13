# Design Document

## Overview

講演音声ファイルのトランスクリプトを活用したDifyチャットフローと連携する音声再生プレイヤーシステム。DjangoをバックエンドとしてWaveSurfer.jsによる音声波形表示機能を持つプレイヤーを構築し、Difyチャットボットとの統合により、チャット応答から抽出された時間範囲での自動頭出し・ループ再生機能を提供する。

## Architecture

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                    Django Web Application                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Templates + JavaScript)                         │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Dify Chat     │  │  Audio Player   │                 │
│  │   (iframe)      │  │  (WaveSurfer.js)│                 │
│  │                 │  │                 │                 │
│  └─────────────────┘  └─────────────────┘                 │
│           │                      │                         │
│           └──────────────────────┘                         │
│              PostMessage API                               │
├─────────────────────────────────────────────────────────────┤
│  Backend (Django Views & APIs)                             │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  Audio File     │  │  Time Range     │                 │
│  │  Management     │  │  Parser         │                 │
│  └─────────────────┘  └─────────────────┘                 │
├─────────────────────────────────────────────────────────────┤
│  External Services                                          │
│  ┌─────────────────┐                                       │
│  │   Dify API      │                                       │
│  │ (djartipy.com)  │                                       │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### 技術スタック

- **Backend**: Django 4.x
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Audio Processing**: WaveSurfer.js v6+
- **Chat Integration**: Dify iframe + PostMessage API
- **Database**: SQLite (開発用) / PostgreSQL (本番用)

## Components and Interfaces

### 1. Django Backend Components

#### AudioPlayerView
- **責任**: メインページの表示とコンテキスト提供
- **URL**: `/` (ルートページ)
- **Template**: `audio_player.html`
- **Context**: 固定音声ファイルパス、Dify設定

#### AudioFileManager
- **責任**: 固定音声ファイルの配信
- **URL**: `/audio/lecture.mp3`
- **機能**: 単一音声ファイルの静的配信

#### TimeRangeParser
- **責任**: チャット応答からの時間範囲抽出
- **入力**: チャット応答テキスト
- **出力**: 時間範囲オブジェクト (start_time, end_time)
- **パターン**: `[MM:SS-MM:SS]` または `[HH:MM:SS-HH:MM:SS]`

### 2. Frontend Components

#### WaveSurferPlayer
```javascript
class WaveSurferPlayer {
    constructor(containerId, audioUrl)
    loadAudio(url)
    setRegion(startTime, endTime)
    updateRegion(regionId, startTime, endTime)
    enableLoopMode(enabled)
    onRegionUpdate(callback)
}
```

#### ChatMessageListener
```javascript
class ChatMessageListener {
    constructor()
    startListening()
    parseTimeRange(message)
    onTimeRangeDetected(callback)
}
```

#### RegionController
```javascript
class RegionController {
    constructor(wavesurfer)
    createRegion(start, end, options)
    updateRegion(regionId, start, end)
    deleteRegion(regionId)
    enableDragResize(enabled)
}
```

### 3. Communication Interfaces

#### PostMessage API Schema
```javascript
// Dify iframe → Parent window
{
    type: 'chat_response',
    data: {
        message: string,
        timestamp: number
    }
}

// Parent window → Audio Player
{
    type: 'set_time_range',
    data: {
        startTime: number, // seconds
        endTime: number    // seconds
    }
}
```

## Data Models

### AudioSettings Model (Simplified)
```python
class AudioSettings(models.Model):
    lecture_title = models.CharField(max_length=200, default="講演音声")
    audio_file_path = models.CharField(max_length=500, default="audio/lecture.mp3")
    duration = models.FloatField(default=0)  # seconds
    
    class Meta:
        # Singleton pattern - only one record allowed
        pass
```

### PlaybackSession Model (Optional)
```python
class PlaybackSession(models.Model):
    start_time = models.FloatField()
    end_time = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
```

## Error Handling

### Frontend Error Handling

1. **音声ファイル読み込みエラー**
   - WaveSurfer.js error イベントをキャッチ
   - ユーザーにエラーメッセージ表示
   - 代替音声ファイルの提案

2. **時間範囲パースエラー**
   - 無効な時間形式の検出
   - 音声ファイル長を超える時間の処理
   - デフォルト範囲へのフォールバック

3. **iframe通信エラー**
   - PostMessage送信失敗の検出
   - タイムアウト処理
   - 手動操作モードへの切り替え

### Backend Error Handling

1. **音声ファイル配信エラー**
   - 固定音声ファイルの存在確認
   - ファイル読み込みエラー処理
   - 適切なHTTPステータスコード返却

2. **API通信エラー**
   - Dify API接続エラー処理
   - レート制限対応
   - エラーログ記録

## Testing Strategy

### Unit Tests

1. **TimeRangeParser Tests**
   ```python
   def test_parse_valid_time_range()
   def test_parse_invalid_format()
   def test_parse_multiple_ranges()
   ```

2. **AudioSettings Model Tests**
   ```python
   def test_audio_settings_singleton()
   def test_default_values()
   ```

### Integration Tests

1. **WaveSurfer.js Integration**
   ```javascript
   describe('WaveSurferPlayer', () => {
       test('loads audio file successfully')
       test('creates region from time range')
       test('handles region drag events')
   })
   ```

2. **PostMessage Communication**
   ```javascript
   describe('ChatMessageListener', () => {
       test('receives iframe messages')
       test('parses time ranges correctly')
       test('triggers player updates')
   })
   ```

### End-to-End Tests

1. **User Workflow Tests**
   - チャット質問 → 応答受信 → 音声頭出し
   - 範囲ドラッグ → ループ再生確認
   - 複数質問での範囲更新確認

### Performance Considerations

1. **音声ファイル最適化**
   - 適切な音声形式（MP3, WAV）
   - ファイルサイズ制限
   - プログレッシブダウンロード対応

2. **WaveSurfer.js最適化**
   - 波形データのキャッシュ
   - レンダリング最適化設定
   - メモリ使用量監視

3. **iframe通信最適化**
   - メッセージ頻度制限
   - 不要な通信の削減
   - エラー時の再試行制御