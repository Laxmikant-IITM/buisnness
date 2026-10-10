import 'package:path/path.dart' as path;
import 'package:sqflite/sqflite.dart';

/// Stores only the local-file metadata needed for offline Drive playback.
///
/// Download acquisition and UI live in their own feature; keeping this lookup
/// isolated lets player diagnostics start at the download boundary.
class DownloadDb {
  DownloadDb._();

  static final DownloadDb instance = DownloadDb._();

  static const String _databaseName = 'lms_mobile_downloads.db';
  static const String _tableName = 'downloads';

  Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    final directory = await getDatabasesPath();
    _database = await openDatabase(
      path.join(directory, _databaseName),
      version: 1,
      onCreate: (db, _) async {
        await db.execute('''
          CREATE TABLE $_tableName (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            contentId TEXT NOT NULL,
            localPath TEXT NOT NULL,
            UNIQUE(userId, contentId)
          )
        ''');
      },
    );
    return _database!;
  }

  /// Finds this user's offline copy; returns null when it has not been saved.
  Future<Map<String, dynamic>?> find(String userId, String contentId) async {
    final rows = await (await database).query(
      _tableName,
      where: 'userId = ? AND contentId = ?',
      whereArgs: [userId, contentId],
      limit: 1,
    );
    return rows.isEmpty ? null : rows.first;
  }

  /// Removes stale metadata after the player detects a missing or broken file.
  Future<void> delete(String userId, String contentId) async {
    await (await database).delete(
      _tableName,
      where: 'userId = ? AND contentId = ?',
      whereArgs: [userId, contentId],
    );
  }
}
