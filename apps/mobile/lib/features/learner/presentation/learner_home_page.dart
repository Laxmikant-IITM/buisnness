import 'package:flutter/material.dart';

const _ink = Color(0xFF202824);
const _muted = Color(0xFF737A73);
const _forest = Color(0xFF29493E);
const _lime = Color(0xFFB8E06A);

/// Mobile learner preview. Replace the local cards with catalog APIs after
/// authentication, course publication, and enrollment rules are implemented.
class LearnerHomePage extends StatefulWidget {
  const LearnerHomePage({super.key});

  @override
  State<LearnerHomePage> createState() => _LearnerHomePageState();
}

class _LearnerHomePageState extends State<LearnerHomePage> {
  int _tab = 0;
  String _query = '';

  // These examples are local preview content, not sellable or enrolled courses.
  static const _courses = <_Course>[
    _Course(
      'Build your first web experience',
      'Technology',
      'Beginner',
      18,
      Color(0xFFD9E7CE),
      '01',
    ),
    _Course(
      'Think clearly with data',
      'Data & business',
      'All levels',
      12,
      Color(0xFFEFDCCF),
      '02',
    ),
    _Course(
      'Design systems, from zero',
      'Design',
      'Intermediate',
      16,
      Color(0xFFDFDFEA),
      '03',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _tab == 0 ? _discover() : _myLearning()),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        backgroundColor: const Color(0xFFFFFEFA),
        indicatorColor: const Color(0xFFE7EDDF),
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore),
            label: 'Discover',
          ),
          NavigationDestination(
            icon: Icon(Icons.book_outlined),
            selectedIcon: Icon(Icons.book),
            label: 'My learning',
          ),
        ],
      ),
    );
  }

  Widget _discover() {
    final query = _query.trim().toLowerCase();
    final courses = _courses.where((course) {
      final searchable = '${course.title} ${course.area}'.toLowerCase();
      return query.isEmpty || searchable.contains(query);
    }).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 16, 22, 28),
      children: [
        _brand(),
        const SizedBox(height: 34),
        const _Eyebrow('A LITTLE SPACE TO GROW'),
        const SizedBox(height: 12),
        Text(
          'Make room for\nwhat’s next.',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 10),
        Text(
          'Focused courses for curious people. Take one useful step at a time.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 22),
        _featuredCard(),
        const SizedBox(height: 30),
        Text('Explore courses', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 13),
        TextField(
          onChanged: (value) => setState(() => _query = value),
          decoration: const InputDecoration(
            hintText: 'Find a course',
            prefixIcon: Icon(Icons.search, size: 20),
            filled: true,
            fillColor: Color(0xFFFFFEFA),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(3)),
            ),
          ),
        ),
        const SizedBox(height: 13),
        if (courses.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 22),
            child: Text('No preview courses match that search.'),
          )
        else
          ...courses.map(
            (course) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _CourseCard(course: course),
            ),
          ),
        const SizedBox(height: 7),
        const Text(
          'Design preview · Sample courses · Enrollment not connected',
          style: TextStyle(color: _muted, fontSize: 11),
        ),
      ],
    );
  }

  Widget _myLearning() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(22, 16, 22, 28),
      children: [
        _brand(),
        const SizedBox(height: 42),
        const _Eyebrow('YOUR SPACE / PREVIEW'),
        const SizedBox(height: 12),
        Text(
          'Pick up a\nthread.',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 10),
        Text(
          'Your library and progress will appear here after sign-in and enrollment are connected.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 25),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFEFA),
            border: Border.all(color: const Color(0xFFE5E5DD)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Eyebrow('SAMPLE COURSE'),
              SizedBox(height: 14),
              Text(
                'Build your first web experience',
                style: TextStyle(
                  color: _ink,
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                ),
              ),
              SizedBox(height: 8),
              Text('Sample progress · Lesson 3 of 18'),
              SizedBox(height: 14),
              LinearProgressIndicator(
                value: .16,
                minHeight: 4,
                color: _forest,
                backgroundColor: Color(0xFFE5E8DE),
              ),
              SizedBox(height: 17),
              Text(
                'Playback will connect after course access is implemented.',
                style: TextStyle(color: _muted, fontSize: 12, height: 1.45),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _brand() {
    return Row(
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: const BoxDecoration(
            color: _forest,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(16),
              topRight: Radius.circular(16),
              bottomRight: Radius.circular(16),
              bottomLeft: Radius.circular(4),
            ),
          ),
          child: const Center(
            child: Text(
              'n',
              style: TextStyle(
                color: _lime,
                fontFamily: 'serif',
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        const Text(
          'northstar.',
          style: TextStyle(
            color: _ink,
            fontSize: 19,
            fontWeight: FontWeight.w800,
            letterSpacing: -1,
          ),
        ),
        const Spacer(),
        IconButton(
          tooltip: 'Profile preview',
          onPressed: () {},
          icon: const Icon(Icons.person_outline, color: _ink),
        ),
      ],
    );
  }

  Widget _featuredCard() {
    return Container(
      height: 176,
      padding: const EdgeInsets.all(18),
      decoration: const BoxDecoration(
        color: Color(0xFFE6EADC),
        borderRadius: BorderRadius.all(Radius.circular(3)),
      ),
      child: const Stack(
        children: [
          Positioned(
            right: -4,
            top: 3,
            child: Icon(
              Icons.circle_outlined,
              size: 126,
              color: Color(0xFFB9C99B),
            ),
          ),
          Positioned(
            right: 23,
            top: 30,
            child: Icon(
              Icons.circle_outlined,
              size: 78,
              color: Color(0xFFB9C99B),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _Eyebrow('A GOOD PLACE TO BEGIN'),
              Spacer(),
              Text(
                'Small steps.\nReal momentum.',
                style: TextStyle(
                  color: _forest,
                  fontSize: 25,
                  height: 1.1,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -.7,
                ),
              ),
              SizedBox(height: 10),
              Text(
                'A learning space in progress',
                style: TextStyle(color: _muted, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Eyebrow extends StatelessWidget {
  const _Eyebrow(this.label);

  final String label;

  @override
  Widget build(BuildContext context) => Text(
        label,
        style: const TextStyle(
          color: _muted,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 1,
        ),
      );
}

class _CourseCard extends StatelessWidget {
  const _CourseCard({required this.course});

  final _Course course;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFFFEFA),
        border: Border.all(color: const Color(0xFFE5E5DD)),
      ),
      child: Row(
        children: [
          Container(
            width: 96,
            height: 122,
            color: course.tint,
            child: Stack(
              children: [
                Positioned(
                  right: 8,
                  top: 25,
                  child: Icon(
                    Icons.circle_outlined,
                    size: 65,
                    color: _forest.withValues(alpha: .35),
                  ),
                ),
                Positioned(
                  left: 10,
                  bottom: 2,
                  child: Text(
                    course.marker,
                    style: const TextStyle(
                      color: Color(0x8CFFFFFF),
                      fontSize: 52,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -5,
                    ),
                  ),
                ),
                const Positioned(
                  left: 8,
                  top: 8,
                  child: Text(
                    'SAMPLE',
                    style: TextStyle(color: _muted, fontSize: 8),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(13),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${course.area.toUpperCase()} · ${course.level.toUpperCase()}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: _muted,
                      fontSize: 8,
                      letterSpacing: .3,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    course.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: _ink,
                      fontSize: 15,
                      height: 1.2,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${course.lessons} short lessons',
                    style: const TextStyle(color: _muted, fontSize: 10),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Course {
  const _Course(
    this.title,
    this.area,
    this.level,
    this.lessons,
    this.tint,
    this.marker,
  );

  final String title;
  final String area;
  final String level;
  final int lessons;
  final Color tint;
  final String marker;
}
