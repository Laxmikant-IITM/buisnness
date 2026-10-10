# Web video player module

This folder owns the preserved web playback components:

- LectureVideoPlayer.tsx selects the provider and platform behavior.
- SecureYouTubePlayer.tsx owns YouTube playback controls and resume behavior.
- CustomVideoPlayer.tsx is retained as a separate player module for future integration.

Player source files are byte-for-byte copies from the Teaching LMS. Keep new product branding and course-page layout outside this directory so player fixes remain local. When changing playback behavior, trace the related API and provider support in the playback map (../../../../../../docs/VIDEO_PLAYBACK.md).

## Support paths

- src/lib/device.ts — device classification used by the source selector.
- src/app/api/lectures/video-position/route.ts — saved YouTube playback position.
- src/app/api/drive-stream/[contentId]/route.ts — protected Google Drive stream.
- src/app/api/content/[id]/variants/route.ts — Drive quality variants.
- src/lib/auth.ts and the enrollment records — session and course-access checks.
- src/lib/drive.ts — server-side Google Drive API access.

The copied player components are not connected to a real learner course page or sign-in flow yet. Preserve their source while those product workflows are built around them.
