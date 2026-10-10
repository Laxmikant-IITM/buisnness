import 'package:supabase_flutter/supabase_flutter.dart';

import '../../config/api_config.dart';

class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  GoTrueClient get _auth => Supabase.instance.client.auth;

  Stream<AuthState> get changes => _auth.onAuthStateChange;
  Session? get currentSession => _auth.currentSession;

  Future<void> signInWithGoogle() => _auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: ApiConfig.authRedirectUri,
        authScreenLaunchMode: LaunchMode.externalApplication,
      );

  Future<void> signOut() => _auth.signOut();
}
