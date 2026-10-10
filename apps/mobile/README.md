# LMS mobile app

This is a fresh Flutter app foundation. It has no migrated users, course data,
production URLs, OAuth client IDs, or existing-project assets.

## Video player code

- `lib/shared/widgets/drive/secure_drive_player.dart` contains the preserved
  Drive player. Keep Drive-specific fixes in `shared/widgets/drive/`.
- `lib/shared/widgets/youtube/secure_youtube_player.dart` contains the preserved
  YouTube player. Keep YouTube-specific fixes in `shared/widgets/youtube/`.
- `lib/shared/widgets/video_watermark.dart` contains the shared floating
  watermark overlay.

These three Dart files are copied byte-for-byte from the existing LMS app. The
small support boundaries they import live under `lib/config/`, `lib/core/`,
and `lib/theme/` so player troubleshooting can start with the player folder,
then follow its documented service dependency.

## Player service dependencies

- **Drive streaming and qualities:** `ApiConfig.baseUrl` serves
  `/api/drive-stream/{contentId}` and `/api/content/{contentId}/variants`.
  The player sends the stored bearer token to both endpoints.
- **Session:** `TokenStorage` supplies the current access token and user ID.
  The new sign-in flow must save them after authentication.
- **Offline Drive playback:** `DownloadDb` looks up and clears the local file
  metadata. The download feature should save the file path with the same user
  and content IDs before the player can open it offline.
- **Playback packages:** Chewie and `video_player` handle playback controls;
  `youtube_explode_dart` resolves YouTube streams and SharedPreferences stores
  each player's quality selection.

The API origin is intentionally configurable and defaults to a local address.
For an Android emulator, point it at the host with:

```sh
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Use the new backend's own HTTPS origin for a deployed build. Never put secrets
or OAuth client IDs in this mobile configuration.

## Debugging playback

1. Start with the player-specific widget and note whether the issue affects
   Drive, YouTube, or both.
2. For Drive, confirm the user token is present, then inspect the stream and
   quality endpoints and the course-access response. For offline issues, check
   the app-private file path and the `DownloadDb` lookup for that user/content.
3. For YouTube, confirm the video ID and network reachability. Stream
   extraction depends on YouTube's changing site behavior, so a break isolated
   to YouTube extraction belongs in that player/package path.
4. If both players fail, check device network permissions, the API origin,
   authentication storage, and platform video playback support first.

The Android/iOS shells and an original learner preview live in this app. The
preview is sample-only and is not a sign-in or live course experience. Northstar
is a temporary design label. Integrate the preserved widgets only after the new
course access and learning flows are implemented.
