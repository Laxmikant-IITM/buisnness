/// Public app configuration. The embedded Supabase key is publishable; database
/// and session secrets stay on the LMS server.
class ApiConfig {
  ApiConfig._();

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://buisnness.vercel.app',
  );
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://hgffzpoikipwmttxqdpa.supabase.co',
  );
  static const String supabasePublishableKey = String.fromEnvironment(
    'SUPABASE_PUBLISHABLE_KEY',
    defaultValue: 'sb_publishable_WyfysPdGUItNe-1Af0eD6A_CMIElTcc',
  );
  static const String authRedirectUri =
      'com.northstar.learning.lms_mobile://login-callback';
  static const String managerUrl = '$baseUrl/manager';
  static const String signInUrl = '$baseUrl/sign-in';

  static Uri get apiOrigin {
    final uri = Uri.parse(baseUrl);
    if (uri.scheme != 'https' &&
        uri.host != '10.0.2.2' &&
        uri.host != 'localhost') {
      throw StateError('The LMS API must use HTTPS outside local development.');
    }
    return uri;
  }

  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 90);
}
