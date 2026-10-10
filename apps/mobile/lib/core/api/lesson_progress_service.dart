import 'package:dio/dio.dart';

import '../../config/api_config.dart';
import '../auth/token_storage.dart';

/// Reads and writes the signed-in learner's server-side playback position.
class LessonProgressService {
  LessonProgressService._();
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: ApiConfig.connectTimeout,
    receiveTimeout: ApiConfig.receiveTimeout,
  ));

  static Future<int> readPosition(String contentId) async {
    final token = await const TokenStorage().read();
    if (token == null || token.isEmpty) return 0;
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/api/lectures/video-position',
        queryParameters: {'contentId': contentId},
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      return response.data?['position'] as int? ?? 0;
    } catch (_) {
      return 0;
    }
  }

  static Future<void> savePosition(String contentId, int position) async {
    final token = await const TokenStorage().read();
    if (token == null || token.isEmpty || position < 0) return;
    try {
      await _dio.post<void>(
        '/api/lectures/video-position',
        data: {'contentId': contentId, 'position': position},
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
    } catch (_) {
      // A transient progress-save failure should not interrupt video playback.
    }
  }
}
