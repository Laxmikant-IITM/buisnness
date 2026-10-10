import 'package:flutter/material.dart';

import 'features/learner/presentation/learner_home_page.dart';

void main() => runApp(const LmsMobileApp());

/// Product theme is independent of the preserved player theme primitives.
class LmsMobileApp extends StatelessWidget {
  const LmsMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    const ink = Color(0xFF202824);
    return MaterialApp(
      title: 'Northstar Learning',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF6F5EF),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF45634F),
          surface: const Color(0xFFFFFEFA),
        ),
        textTheme: const TextTheme(
          headlineMedium: TextStyle(
            color: ink,
            fontSize: 29,
            fontWeight: FontWeight.w700,
            height: 1.08,
            letterSpacing: -1.1,
          ),
          titleLarge: TextStyle(
            color: ink,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.4,
          ),
          bodyMedium: TextStyle(color: Color(0xFF6E766F), height: 1.45),
        ),
      ),
      home: const LearnerHomePage(),
    );
  }
}
