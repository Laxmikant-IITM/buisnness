# Video playback support map

Player source was copied exactly from the existing Teaching LMS. Do not reformat or redesign these files as part of the new product shell. Fix a playback issue in the smallest owning area, then follow its dependency path below.

## Web

| Responsibility | New product location | Support path |
|---|---|---|
| Select Drive or YouTube playback by device/source | `apps/web/src/features/learning/video-player/LectureVideoPlayer.tsx` | `apps/web/src/lib/device.ts`; its caller must provide course content/source IDs and URLs. |
| Secure YouTube playback, quality, resume | `apps/web/src/features/learning/video-player/SecureYouTubePlayer.tsx` | `apps/web/src/app/api/lectures/video-position/route.ts`; session and `LectureProgress` records. |
| Additional custom playback component | `apps/web/src/features/learning/video-player/CustomVideoPlayer.tsx` | Retained as a player module; confirm its intended caller when integrating the learning page. |
| Protected Drive stream/range handling | `apps/web/src/app/api/drive-stream/[contentId]/route.ts` | `apps/web/src/lib/drive.ts`, session/enrollment checks, Google Drive server credentials. |
| Quality variants | `apps/web/src/app/api/content/[id]/variants/route.ts` | Current content access check and `Content.videoVariants`. |

Web dependencies include the YouTube IFrame API, `lucide-react`, and Capacitor packages for the existing native-platform/orientation hooks. Google credentials remain server-side.

## Flutter

| Responsibility | New product location | Support path |
|---|---|---|
| Secure Google Drive playback and offline file lookup | `apps/mobile/lib/shared/widgets/drive/secure_drive_player.dart` | `lib/config/api_config.dart`, `lib/core/auth/token_storage.dart`, `lib/core/downloads/download_db.dart`, `/api/drive-stream/{contentId}`, and `/api/content/{contentId}/variants`. |
| Secure YouTube playback and stream selection | `apps/mobile/lib/shared/widgets/youtube/secure_youtube_player.dart` | `video_player`, `youtube_explode_dart`, SharedPreferences quality settings, and `lib/theme/`. |
| Shared floating watermark | `apps/mobile/lib/shared/widgets/video_watermark.dart` | Used by the owning player UI. |

`TokenStorage` reads/writes the new app's token and user ID. The future sign-in API must issue compatible credentials and save them. `DownloadDb` is only a local lookup for offline files; the download acquisition/user interface is not present yet.

## Troubleshooting order

1. Decide whether the failure is Drive, YouTube, or both; record platform, URL/source type, and whether playback is online or offline.
2. Start with the corresponding player file above; keep the exact source file intact unless fixing the issue requires a behavior change.
3. If the widget is correct, trace its API origin, token/session, endpoint response, enrollment check, and provider adapter.
4. For Flutter offline Drive, inspect the local file and `(userId, contentId)` metadata lookup before investigating the network stream.
5. Keep provider credentials and tokens out of logs and diagnostics. Record any deliberate compatibility change in an architecture decision note.

## Scope limits

The new sign-in flow, content integration, download acquisition flow, course authorization data, and production Google configuration are not finished. The player modules are preserved, but that alone does not mean the new product can play real courses yet.
