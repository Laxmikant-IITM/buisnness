# Northstar Learning for Android

This Flutter app uses the LMS production API and Supabase Auth project already
connected to the web app. Learner courses, lesson metadata, enrollment checks,
and saved progress come from the live LMS database through server APIs. The
mobile app does not connect to Postgres directly and contains no database or
session-signing secret.

Google login uses Supabase OAuth with the Android deep link
`com.northstar.learning.lms_mobile://login-callback`. Add that exact URL to the
Supabase project's **Authentication → URL Configuration → Additional Redirect
URLs** before testing Google sign-in. The Google provider must be enabled in
that same Supabase project. Supabase and LMS sessions are stored using Android
encrypted storage.

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

The app defaults to the production LMS origin. For local Android-emulator
development, point the API at the host machine with:

```sh
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

The Supabase URL and publishable key are public client configuration. Never put
database passwords, Supabase secret/service-role keys, or the LMS session
signing secret in this mobile configuration.

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

The learner home uses the same paper, forest, and lime design tokens as the web
learning area. Manager accounts can open the existing manager workspace in the
browser; course and user-management actions remain protected by the web API.
