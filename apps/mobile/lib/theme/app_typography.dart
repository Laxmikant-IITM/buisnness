import 'package:flutter/material.dart';

/// Minimal typography aliases consumed by the preserved player widgets.
class AppTypography {
  AppTypography._();

  static const TextStyle bodyMuted = TextStyle(fontSize: 13);
  static const TextStyle h2 = TextStyle(fontSize: 20, fontWeight: FontWeight.w600);
  static const TextStyle title = TextStyle(fontSize: 15, fontWeight: FontWeight.w600);
  static const TextStyle caption = TextStyle(fontSize: 12);
  static const TextStyle body = TextStyle(fontSize: 14);
  static const TextStyle uppercase = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: 1.1,
  );
}
