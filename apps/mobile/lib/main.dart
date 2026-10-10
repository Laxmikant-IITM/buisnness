import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config/api_config.dart';
import 'core/api/lms_api.dart';
import 'core/auth/auth_service.dart';
import 'core/auth/secure_supabase_storage.dart';
import 'core/auth/token_storage.dart';
import 'features/learner/presentation/learner_home_page.dart';

const _ink = Color(0xFF202824);
const _paper = Color(0xFFF6F5EF);
const _forest = Color(0xFF29493E);
const _lime = Color(0xFFB8E06A);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(
    url: ApiConfig.supabaseUrl,
    publishableKey: ApiConfig.supabasePublishableKey,
    authOptions: FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
      localStorage: SecureSupabaseStorage(),
    ),
  );
  runApp(const NorthstarApp());
}

class NorthstarApp extends StatelessWidget {
  const NorthstarApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Northstar Learning',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          scaffoldBackgroundColor: _paper,
          colorScheme: ColorScheme.fromSeed(
              seedColor: _forest, surface: const Color(0xFFFFFEFA)),
          fontFamily: 'sans-serif',
          textTheme: const TextTheme(
            headlineMedium: TextStyle(
                color: _ink,
                fontSize: 34,
                fontWeight: FontWeight.w700,
                height: 1.04,
                letterSpacing: -1.4),
            titleLarge: TextStyle(
                color: _ink,
                fontSize: 19,
                fontWeight: FontWeight.w700,
                letterSpacing: -.5),
            bodyMedium:
                TextStyle(color: Color(0xFF737A73), height: 1.55, fontSize: 14),
          ),
          inputDecorationTheme: const InputDecorationTheme(
            filled: true,
            fillColor: Color(0xFFFFFEFA),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.zero,
                borderSide: BorderSide(color: Color(0xFFDEDFD7))),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.zero,
                borderSide: BorderSide(color: Color(0xFFDEDFD7))),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.zero,
                borderSide: BorderSide(color: _forest)),
          ),
        ),
        home: const AuthGate(),
      );
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});
  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  StreamSubscription<AuthState>? _subscription;
  Map<String, dynamic>? _user;
  String? _error;
  bool _loading = true;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _subscription = AuthService.instance.changes.listen((state) {
      if (state.event == AuthChangeEvent.initialSession &&
          state.session == null) {
        if (mounted) setState(() => _loading = false);
      } else if (state.event == AuthChangeEvent.signedIn ||
          state.event == AuthChangeEvent.tokenRefreshed ||
          state.event == AuthChangeEvent.initialSession) {
        _syncSession(state.session);
      } else if (state.event == AuthChangeEvent.signedOut) {
        _clearSession();
      }
    });
    final session = AuthService.instance.currentSession;
    if (session == null) {
      _loading = false;
    } else {
      unawaited(_syncSession(session));
    }
  }

  Future<void> _syncSession(Session? session) async {
    if (_syncing || session == null) return;
    _syncing = true;
    if (mounted) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final user =
          await LmsApi.instance.exchangeSupabaseSession(session.accessToken);
      if (!mounted) return;
      setState(() {
        _user = user;
        _loading = false;
        _error = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _user = null;
        _loading = false;
        _error = error is LmsApiException
            ? error.message
            : 'Could not finish signing in. Try again.';
      });
      await AuthService.instance.signOut();
    } finally {
      _syncing = false;
    }
  }

  Future<void> _clearSession() async {
    await const TokenStorage().clear();
    if (mounted) {
      setState(() {
        _user = null;
        _error = null;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const _LoadingScreen(label: 'Opening your learning space…');
    }
    final user = _user;
    if (user == null) return SignInPage(error: _error);
    return LearnerHomePage(
      user: user,
      onSignOut: () async {
        await AuthService.instance.signOut();
        await const TokenStorage().clear();
      },
    );
  }
}

class SignInPage extends StatefulWidget {
  const SignInPage({super.key, this.error});
  final String? error;
  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  bool _busy = false;
  String? _message;

  Future<void> _signIn() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await AuthService.instance.signInWithGoogle();
    } catch (error) {
      if (!mounted) return;
      setState(() => _message =
          'Google sign-in could not start. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const _Brand(),
                      const SizedBox(height: 38),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(24, 28, 24, 26),
                        decoration: BoxDecoration(
                            color: const Color(0xFFFFFEFA),
                            border: Border.all(color: const Color(0xFFE5E7DF))),
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _Eyebrow('YOUR LEARNING SPACE'),
                              const SizedBox(height: 14),
                              Text('Welcome back.',
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineMedium),
                              const SizedBox(height: 10),
                              Text(
                                  'Sign in to open your courses or manager workspace.',
                                  style:
                                      Theme.of(context).textTheme.bodyMedium),
                              const SizedBox(height: 26),
                              SizedBox(
                                width: double.infinity,
                                height: 54,
                                child: OutlinedButton(
                                  onPressed: _busy ? null : _signIn,
                                  style: OutlinedButton.styleFrom(
                                      foregroundColor: _ink,
                                      side: const BorderSide(
                                          color: Color(0xFFD8DAD2)),
                                      shape: const RoundedRectangleBorder()),
                                  child: _busy
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2, color: _forest))
                                      : const Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                              Text('G',
                                                  style: TextStyle(
                                                      fontSize: 22,
                                                      fontWeight:
                                                          FontWeight.w700,
                                                      color:
                                                          Color(0xFF4285F4))),
                                              SizedBox(width: 12),
                                              Text('Continue with Google',
                                                  style: TextStyle(
                                                      fontWeight:
                                                          FontWeight.w600)),
                                            ]),
                                ),
                              ),
                              if (widget.error != null || _message != null) ...[
                                const SizedBox(height: 16),
                                Text(_message ?? widget.error!,
                                    style: const TextStyle(
                                        color: Color(0xFF9C493C),
                                        fontSize: 13)),
                              ],
                              const SizedBox(height: 24),
                              const Divider(color: Color(0xFFE4E5DE)),
                              const SizedBox(height: 16),
                              const Text(
                                  'First-time Google sign-ins create a student account automatically. Management access is assigned by role.',
                                  style: TextStyle(
                                      color: Color(0xFF737A73),
                                      height: 1.55,
                                      fontSize: 12)),
                            ]),
                      ),
                      const SizedBox(height: 18),
                      const Text(
                          'Your courses and progress are always loaded from your LMS account.',
                          style: TextStyle(
                              color: Color(0xFF8A9189),
                              fontSize: 11,
                              height: 1.5)),
                    ]),
              ),
            ),
          ),
        ),
      );
}

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
          const CircularProgressIndicator(color: _forest),
          const SizedBox(height: 18),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
        ])),
      );
}

class _Brand extends StatelessWidget {
  const _Brand();
  @override
  Widget build(BuildContext context) => Row(children: [
        Container(
            width: 30,
            height: 30,
            decoration: const BoxDecoration(
                color: _forest,
                borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                    bottomRight: Radius.circular(16),
                    bottomLeft: Radius.circular(4))),
            child: const Center(
                child: Text('n',
                    style: TextStyle(
                        color: _lime,
                        fontFamily: 'serif',
                        fontSize: 20,
                        fontWeight: FontWeight.w700)))),
        const SizedBox(width: 9),
        const Text('northstar',
            style: TextStyle(
                color: _ink,
                fontSize: 18,
                fontWeight: FontWeight.w800,
                letterSpacing: -1)),
        const Text('.',
            style: TextStyle(
                color: Color(0xFF78964E),
                fontSize: 20,
                fontWeight: FontWeight.w700)),
      ]);
}

class _Eyebrow extends StatelessWidget {
  const _Eyebrow(this.label);
  final String label;
  @override
  Widget build(BuildContext context) => Text(label,
      style: const TextStyle(
          color: Color(0xFF73806E),
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.3));
}
