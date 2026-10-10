/// Runtime configuration for the new product API.
///
/// Supply the API address at build/run time with `--dart-define=API_BASE_URL=...`.
/// The default is local-only and deliberately contains no existing project URL.
class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 90);
}
