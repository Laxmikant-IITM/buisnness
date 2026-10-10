import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../config/api_config.dart';
import '../../../core/api/lms_api.dart';
import '../../../shared/widgets/drive/secure_drive_player.dart';
import '../../../shared/widgets/youtube/secure_youtube_player.dart';

const _ink = Color(0xFF202824);
const _forest = Color(0xFF29493E);
const _paper = Color(0xFFF6F5EF);
const _line = Color(0xFFDEDFD7);

class LearnerHomePage extends StatefulWidget {
  const LearnerHomePage(
      {super.key, required this.user, required this.onSignOut});
  final Map<String, dynamic> user;
  final Future<void> Function() onSignOut;

  @override
  State<LearnerHomePage> createState() => _LearnerHomePageState();
}

class _LearnerHomePageState extends State<LearnerHomePage> {
  DashboardData? _dashboard;
  String? _error;
  bool _loading = true;
  bool _signingOut = false;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final dashboard = await LmsApi.instance.loadDashboard();
      if (mounted) {
        setState(() {
          _dashboard = dashboard;
          _loading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error is LmsApiException
              ? error.message
              : 'Could not load your learning space.';
          _loading = false;
        });
      }
    }
  }

  Future<void> _signOut() async {
    if (_signingOut) return;
    setState(() => _signingOut = true);
    await widget.onSignOut();
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = _dashboard;
    final email = dashboard?.email.isNotEmpty == true
        ? dashboard!.email
        : widget.user['email'] as String? ?? '';
    return Scaffold(
      body: SafeArea(
          child: _tab == 0
              ? _learningTab(dashboard, email)
              : _accountTab(dashboard, email)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        backgroundColor: const Color(0xFFFFFEFA),
        indicatorColor: const Color(0xFFE7EDDF),
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.menu_book_outlined),
              selectedIcon: Icon(Icons.menu_book),
              label: 'My learning'),
          NavigationDestination(
              icon: Icon(Icons.account_circle_outlined),
              selectedIcon: Icon(Icons.account_circle),
              label: 'Account'),
        ],
      ),
    );
  }

  Widget _learningTab(DashboardData? dashboard, String email) =>
      RefreshIndicator(
        color: _forest,
        onRefresh: _loadDashboard,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(22, 15, 22, 30),
          children: [
            _TopBar(email: email, onAccount: () => setState(() => _tab = 1)),
            const SizedBox(height: 36),
            const _Eyebrow('YOUR LEARNING SPACE'),
            const SizedBox(height: 11),
            Text('Keep your\nmomentum.',
                style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 10),
            Text(
                'Your enrolled courses, next lesson, and saved progress live here.',
                style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 30),
            if (_loading)
              const Padding(
                  padding: EdgeInsets.symmetric(vertical: 36),
                  child:
                      Center(child: CircularProgressIndicator(color: _forest)))
            else if (_error != null)
              _NoticeCard(
                  message: _error!,
                  actionLabel: 'Try again',
                  onAction: _loadDashboard)
            else if (dashboard?.courses.isEmpty ?? true)
              _NoticeCard(
                eyebrow: 'MY COURSES',
                title: 'No active courses yet',
                message:
                    'When an enrollment is attached to this account, the course and its lessons will appear here.',
                actionLabel: 'Refresh',
                onAction: _loadDashboard,
              )
            else ...[
              Text('Your courses',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 14),
              ...dashboard!.courses.map((course) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _CourseCard(course: course),
                  )),
            ],
          ],
        ),
      );

  Widget _accountTab(DashboardData? dashboard, String email) {
    final role =
        (dashboard?.role ?? widget.user['role'] as String? ?? 'STUDENT')
            .replaceAll('_', ' ');
    final hasManagerWorkspace = const {
      'MANAGER',
      'SUPER MANAGER',
      'ADMIN',
      'INSTRUCTOR'
    }.contains(role);
    return ListView(
        padding: const EdgeInsets.fromLTRB(22, 15, 22, 30),
        children: [
          const _TopBar(),
          const SizedBox(height: 36),
          const _Eyebrow('ACCOUNT'),
          const SizedBox(height: 11),
          Text('Your space.',
              style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
                color: const Color(0xFFFFFEFA),
                border: Border.all(color: const Color(0xFFE5E7DF))),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const _Eyebrow('SIGNED IN AS'),
              const SizedBox(height: 9),
              SelectableText(email,
                  style: const TextStyle(
                      color: _ink, fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 15),
              Row(children: [
                const _Eyebrow('ACCESS'),
                const SizedBox(width: 12),
                Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                    color: const Color(0xFFE7EDDF),
                    child: Text(role,
                        style: const TextStyle(
                            color: _forest,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: .4))),
              ]),
            ]),
          ),
          if (hasManagerWorkspace) ...[
            const SizedBox(height: 16),
            _NoticeCard(
              eyebrow: 'MANAGEMENT',
              title: 'Open the manager workspace',
              message:
                  'Course and user management is available in your secure LMS workspace.',
              actionLabel: 'Open manager workspace',
              onAction: () => launchUrl(Uri.parse(ApiConfig.managerUrl),
                  mode: LaunchMode.externalApplication),
            ),
          ],
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: _signingOut ? null : _signOut,
            icon: const Icon(Icons.logout, size: 18),
            label: Text(_signingOut ? 'Signing out…' : 'Sign out'),
            style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
                foregroundColor: _ink,
                side: const BorderSide(color: _line),
                shape: const RoundedRectangleBorder()),
          ),
        ]);
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({this.email, this.onAccount});
  final String? email;
  final VoidCallback? onAccount;
  @override
  Widget build(BuildContext context) => Row(children: [
        const _Brand(),
        const Spacer(),
        if (email != null)
          IconButton(
              onPressed: onAccount,
              tooltip: 'Account',
              icon: const Icon(Icons.account_circle_outlined,
                  color: Color(0xFF5B685D))),
      ]);
}

class _Brand extends StatelessWidget {
  const _Brand();
  @override
  Widget build(BuildContext context) => Row(children: [
        Container(
            width: 29,
            height: 29,
            decoration: const BoxDecoration(
                color: _forest,
                borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(15),
                    topRight: Radius.circular(15),
                    bottomRight: Radius.circular(15),
                    bottomLeft: Radius.circular(4))),
            child: const Center(
                child: Text('n',
                    style: TextStyle(
                        color: Color(0xFFB8E06A),
                        fontFamily: 'serif',
                        fontSize: 19,
                        fontWeight: FontWeight.w700)))),
        const SizedBox(width: 8),
        const Text('northstar',
            style: TextStyle(
                color: _ink,
                fontSize: 17,
                fontWeight: FontWeight.w800,
                letterSpacing: -1)),
        const Text('.',
            style: TextStyle(
                color: Color(0xFF78964E),
                fontSize: 19,
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
          fontSize: 9,
          fontWeight: FontWeight.w600,
          letterSpacing: 1.25));
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({required this.course});
  final CourseData course;

  @override
  Widget build(BuildContext context) {
    final percent = course.lessonCount == 0
        ? 0.0
        : (course.startedCount / course.lessonCount).clamp(0.0, 1.0);
    final topics = <String, List<LessonSummary>>{};
    for (final lesson in course.lessons) {
      topics.putIfAbsent(lesson.topic, () => []).add(lesson);
    }
    LessonSummary? nextLesson;
    for (final lesson in course.lessons) {
      if (lesson.status != 'COMPLETED') {
        nextLesson = lesson;
        break;
      }
    }
    nextLesson ??= course.lessons.isEmpty ? null : course.lessons.first;
    final lessonToResume = nextLesson;
    return Container(
      padding: const EdgeInsets.all(19),
      decoration: BoxDecoration(
          color: const Color(0xFFFFFEFA),
          border: Border.all(color: const Color(0xFFE5E7DF))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                _Eyebrow(course.accessType.replaceAll('_', ' ')),
                const SizedBox(height: 9),
                Text(course.title,
                    style: Theme.of(context).textTheme.titleLarge),
              ])),
          Container(
              width: 55,
              height: 55,
              color: const Color(0xFFEDF1E5),
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('${course.lessonCount}',
                        style: const TextStyle(
                            color: _forest,
                            fontSize: 20,
                            fontWeight: FontWeight.w700)),
                    const Text('lessons',
                        style: TextStyle(color: Color(0xFF687363), fontSize: 9))
                  ])),
        ]),
        if (course.description?.trim().isNotEmpty == true) ...[
          const SizedBox(height: 9),
          Text(course.description!,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(fontSize: 12)),
        ],
        const SizedBox(height: 19),
        ClipRRect(
            borderRadius: BorderRadius.zero,
            child: LinearProgressIndicator(
                value: percent,
                minHeight: 4,
                color: const Color(0xFF78964E),
                backgroundColor: const Color(0xFFE8EAE3))),
        const SizedBox(height: 8),
        Text('${course.startedCount} of ${course.lessonCount} lessons started',
            style: const TextStyle(color: Color(0xFF737A73), fontSize: 10)),
        if (lessonToResume != null && lessonToResume.id.isNotEmpty) ...[
          const SizedBox(height: 16),
          SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => _openLesson(context, course, lessonToResume),
                style: FilledButton.styleFrom(
                    backgroundColor: _ink,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(46),
                    shape: const RoundedRectangleBorder()),
                child:
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(course.startedCount == 0
                      ? 'Start learning'
                      : 'Continue learning'),
                  const SizedBox(width: 12),
                  const Icon(Icons.arrow_forward, size: 17)
                ]),
              )),
        ],
        if (course.lessons.isNotEmpty) ...[
          const SizedBox(height: 13),
          Theme(
            data: Theme.of(context).copyWith(
                dividerColor: Colors.transparent,
                splashColor: Colors.transparent),
            child: ExpansionTile(
              tilePadding: EdgeInsets.zero,
              childrenPadding: EdgeInsets.zero,
              title: const Text('View course lessons',
                  style: TextStyle(
                      color: Color(0xFF485349),
                      fontSize: 12,
                      fontWeight: FontWeight.w700)),
              trailing: Text('${course.lessons.length}  +',
                  style:
                      const TextStyle(color: Color(0xFF737A73), fontSize: 11)),
              children: topics.entries
                  .map((topic) => _TopicLessons(
                      course: course, topic: topic.key, lessons: topic.value))
                  .toList(),
            ),
          ),
        ] else ...[
          const SizedBox(height: 12),
          const Text('Lessons have not been added to this course yet.',
              style: TextStyle(color: Color(0xFF737A73), fontSize: 11)),
        ],
      ]),
    );
  }

  void _openLesson(
      BuildContext context, CourseData course, LessonSummary lesson) {
    Navigator.of(context).push(MaterialPageRoute<void>(
        builder: (_) => LessonPage(courseId: course.id, lesson: lesson)));
  }
}

class _TopicLessons extends StatelessWidget {
  const _TopicLessons(
      {required this.course, required this.topic, required this.lessons});
  final CourseData course;
  final String topic;
  final List<LessonSummary> lessons;
  @override
  Widget build(BuildContext context) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
            padding: const EdgeInsets.only(top: 10, bottom: 5),
            child: _Eyebrow(topic.isEmpty ? 'LESSONS' : topic)),
        ...lessons.map((lesson) => InkWell(
              onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
                  builder: (_) =>
                      LessonPage(courseId: course.id, lesson: lesson))),
              child: Container(
                constraints: const BoxConstraints(minHeight: 46),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: const BoxDecoration(
                    border:
                        Border(bottom: BorderSide(color: Color(0xFFEFF0EA)))),
                child: Row(children: [
                  Icon(
                      lesson.status == 'COMPLETED'
                          ? Icons.check_circle
                          : Icons.play_circle_outline,
                      size: 17,
                      color: const Color(0xFF82946F)),
                  const SizedBox(width: 9),
                  Expanded(
                      child: Text(lesson.title,
                          style: const TextStyle(
                              color: Color(0xFF303A33), fontSize: 12))),
                  if (lesson.duration?.isNotEmpty == true)
                    Text(lesson.duration!,
                        style: const TextStyle(
                            color: Color(0xFF737A73), fontSize: 10)),
                ]),
              ),
            )),
      ]);
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard(
      {this.eyebrow,
      this.title,
      required this.message,
      required this.actionLabel,
      required this.onAction});
  final String? eyebrow;
  final String? title;
  final String message;
  final String actionLabel;
  final Future<void> Function() onAction;
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
            color: const Color(0xFFFFFEFA),
            border: Border.all(color: const Color(0xFFE5E7DF))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (eyebrow != null) ...[
            _Eyebrow(eyebrow!),
            const SizedBox(height: 9)
          ],
          if (title != null) ...[
            Text(title!, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8)
          ],
          Text(message,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(fontSize: 12)),
          const SizedBox(height: 15),
          OutlinedButton(
              onPressed: () => onAction(),
              style: OutlinedButton.styleFrom(
                  foregroundColor: _ink,
                  side: const BorderSide(color: _line),
                  shape: const RoundedRectangleBorder()),
              child: Text(actionLabel)),
        ]),
      );
}

class LessonPage extends StatefulWidget {
  const LessonPage({super.key, required this.courseId, required this.lesson});
  final String courseId;
  final LessonSummary lesson;
  @override
  State<LessonPage> createState() => _LessonPageState();
}

class _LessonPageState extends State<LessonPage> {
  LessonData? _lesson;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final lesson =
          await LmsApi.instance.loadLesson(widget.courseId, widget.lesson.id);
      if (mounted) {
        setState(() {
          _lesson = lesson;
          _loading = false;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error is LmsApiException
              ? error.message
              : 'This lesson could not be loaded right now.';
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
            backgroundColor: _paper,
            surfaceTintColor: _paper,
            title: const _Brand(),
            leading: IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back))),
        body: _loading
            ? const Center(child: CircularProgressIndicator(color: _forest))
            : _error != null
                ? Center(
                    child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: _NoticeCard(
                            message: _error!,
                            actionLabel: 'Try again',
                            onAction: _load)))
                : _lessonBody(_lesson!),
      );

  Widget _lessonBody(LessonData lesson) {
    final youtube = lesson.videoSource.toUpperCase() == 'YOUTUBE';
    final videoId = youtube ? _youtubeId(lesson.youtubeUrl) : null;
    return ListView(
        padding: const EdgeInsets.fromLTRB(18, 4, 18, 30),
        children: [
          _Eyebrow(
              lesson.topic.isEmpty ? 'LESSON' : lesson.topic.toUpperCase()),
          const SizedBox(height: 8),
          Text(lesson.title,
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontSize: 28)),
          if (lesson.duration?.isNotEmpty == true) ...[
            const SizedBox(height: 8),
            Text(lesson.duration!,
                style: const TextStyle(color: Color(0xFF737A73), fontSize: 11)),
          ],
          const SizedBox(height: 20),
          if (youtube && videoId == null)
            const _NoticeCard(
                message:
                    'This lesson has an invalid YouTube link. Please contact your course manager.',
                actionLabel: 'Back to courses',
                onAction: _noAction)
          else if (youtube)
            SecureYouTubePlayer(
                videoId: videoId!,
                contentId: lesson.id,
                title: lesson.title,
                autoplay: true)
          else
            SecureDrivePlayer(
                contentId: lesson.id, title: lesson.title, autoplay: true),
          if (lesson.description?.trim().isNotEmpty == true) ...[
            const SizedBox(height: 20),
            Text(lesson.description!,
                style: Theme.of(context).textTheme.bodyMedium),
          ],
          const SizedBox(height: 18),
          TextButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.list),
              label: const Text('Back to my courses'),
              style: TextButton.styleFrom(
                  foregroundColor: _forest, alignment: Alignment.centerLeft)),
        ]);
  }

  static Future<void> _noAction() async {}

  String? _youtubeId(String? input) {
    if (input == null || input.trim().isEmpty) return null;
    final uri = Uri.tryParse(input.trim());
    if (uri == null) return null;
    final host = uri.host.toLowerCase();
    if (host == 'youtu.be' || host.endsWith('.youtu.be')) {
      return uri.pathSegments.isEmpty ? null : uri.pathSegments.first;
    }
    if (host.contains('youtube.com')) {
      final id = uri.queryParameters['v'];
      if (id != null && id.isNotEmpty) return id;
      final segments = uri.pathSegments;
      final marker = segments.indexWhere(
          (segment) => const {'embed', 'shorts', 'live'}.contains(segment));
      if (marker >= 0 && marker + 1 < segments.length) {
        return segments[marker + 1];
      }
    }
    return null;
  }
}
