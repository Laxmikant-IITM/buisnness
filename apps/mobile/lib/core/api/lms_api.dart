import 'package:dio/dio.dart';

import '../../config/api_config.dart';
import '../auth/token_storage.dart';

class LmsApiException implements Exception {
  const LmsApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override
  String toString() => message;
}

class LmsApi {
  LmsApi._()
      : _dio = Dio(BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: ApiConfig.connectTimeout,
          receiveTimeout: ApiConfig.receiveTimeout,
          headers: const {'Accept': 'application/json'},
        ));

  static final LmsApi instance = LmsApi._();
  final Dio _dio;
  final TokenStorage _storage = const TokenStorage();

  Future<Map<String, dynamic>> exchangeSupabaseSession(
      String accessToken) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/api/auth/mobile/session',
        data: {'accessToken': accessToken},
      );
      final data = response.data ?? const <String, dynamic>{};
      final lmsToken = data['token'];
      final user = data['user'];
      if (lmsToken is! String || user is! Map<String, dynamic>) {
        throw const LmsApiException(
            'The sign-in service returned an incomplete session.');
      }
      await _storage.save(token: lmsToken, userId: user['id'] as String);
      return user;
    } on DioException catch (error) {
      throw _exception(error);
    }
  }

  Future<DashboardData> loadDashboard() async {
    try {
      final response = await _authorized()
          .get<Map<String, dynamic>>('/api/learner/dashboard');
      final data = response.data ?? const <String, dynamic>{};
      final rawUser = data['user'];
      final rows = data['courses'];
      if (rawUser is! Map<String, dynamic> || rows is! List) {
        throw const LmsApiException(
            'The learning dashboard returned an invalid response.');
      }
      return DashboardData(
        email: rawUser['email'] as String? ?? '',
        role: rawUser['role'] as String? ?? 'STUDENT',
        courses: rows
            .whereType<Map<String, dynamic>>()
            .map(CourseData.fromJson)
            .toList(),
      );
    } on DioException catch (error) {
      throw _exception(error);
    }
  }

  Future<LessonData> loadLesson(String courseId, String contentId) async {
    try {
      final response = await _authorized().get<Map<String, dynamic>>(
        '/api/mobile/courses/$courseId/lessons/$contentId',
      );
      return LessonData.fromJson(response.data ?? const {});
    } on DioException catch (error) {
      throw _exception(error);
    }
  }

  Dio _authorized() {
    final token = _storage.read();
    final dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: const {'Accept': 'application/json'},
    ));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final bearer = await token;
        if (bearer == null || bearer.isEmpty) {
          return handler.reject(DioException(
            requestOptions: options,
            error: const LmsApiException('Sign in to continue.'),
          ));
        }
        options.headers['Authorization'] = 'Bearer $bearer';
        handler.next(options);
      },
    ));
    return dio;
  }

  LmsApiException _exception(DioException error) {
    final body = error.response?.data;
    final message = body is Map<String, dynamic> && body['error'] is String
        ? body['error'] as String
        : error.type == DioExceptionType.connectionTimeout ||
                error.type == DioExceptionType.receiveTimeout
            ? 'The server took too long to respond. Check your connection and try again.'
            : 'Could not connect to the LMS. Check your connection and try again.';
    return LmsApiException(message, statusCode: error.response?.statusCode);
  }
}

class DashboardData {
  const DashboardData(
      {required this.email, required this.role, required this.courses});
  final String email;
  final String role;
  final List<CourseData> courses;
}

class CourseData {
  const CourseData({
    required this.id,
    required this.title,
    required this.description,
    required this.accessType,
    required this.lessonCount,
    required this.startedCount,
    required this.completedCount,
    required this.lessons,
  });

  final String id;
  final String title;
  final String? description;
  final String accessType;
  final int lessonCount;
  final int startedCount;
  final int completedCount;
  final List<LessonSummary> lessons;

  factory CourseData.fromJson(Map<String, dynamic> json) {
    final rawLessons = json['lessons'];
    return CourseData(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      accessType: json['accessType'] as String? ?? 'RECORDED',
      lessonCount: json['lessonCount'] as int? ?? 0,
      startedCount: json['startedCount'] as int? ?? 0,
      completedCount: json['completedCount'] as int? ?? 0,
      lessons: rawLessons is List
          ? rawLessons
              .whereType<Map<String, dynamic>>()
              .map(LessonSummary.fromJson)
              .toList()
          : const [],
    );
  }
}

class LessonSummary {
  const LessonSummary({
    required this.id,
    required this.title,
    required this.topic,
    required this.duration,
    required this.status,
    required this.videoPosition,
    required this.topicOrder,
    required this.order,
  });

  final String id;
  final String title;
  final String topic;
  final String? duration;
  final String status;
  final int videoPosition;
  final int topicOrder;
  final int order;

  factory LessonSummary.fromJson(Map<String, dynamic> json) => LessonSummary(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        topic: json['topic'] as String? ?? '',
        duration: json['duration'] as String?,
        status: json['status'] as String? ?? 'NOT_STARTED',
        videoPosition: json['videoPosition'] as int? ?? 0,
        topicOrder: json['topicOrder'] as int? ?? 0,
        order: json['order'] as int? ?? 0,
      );
}

class LessonData {
  const LessonData({
    required this.id,
    required this.title,
    required this.description,
    required this.videoSource,
    required this.youtubeUrl,
    required this.duration,
    required this.topic,
  });

  final String id;
  final String title;
  final String? description;
  final String videoSource;
  final String? youtubeUrl;
  final String? duration;
  final String topic;

  factory LessonData.fromJson(Map<String, dynamic> json) => LessonData(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        description: json['description'] as String?,
        videoSource: json['videoSource'] as String? ?? 'GOOGLE_DRIVE',
        youtubeUrl: json['youtubeUrl'] as String?,
        duration: json['duration'] as String?,
        topic: json['topic'] as String? ?? '',
      );
}
