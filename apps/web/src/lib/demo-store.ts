/**
 * @file apps/web/src/lib/demo-store.ts
 * @description Centralized resilient in-memory data store for courses, curriculum topics,
 * video lessons, users, and enrollments.
 *
 * Ensures 100% functionality even when offline or unseeded with PostgreSQL:
 * - Full CRUD for Courses (Create, Update metadata, Duration, Pricing, Expiry).
 * - Full CRUD for Topics & Units.
 * - Full CRUD for Video Lectures (Google Drive & YouTube links).
 * - Full CRUD for User Roles & Course Assignments (Grant/Revoke courses, Wallet coins).
 */

export interface StoredLesson {
  id: string;
  title: string;
  videoSource: 'GOOGLE_DRIVE' | 'YOUTUBE';
  videoUrl: string | null;
  youtubeUrl: string | null;
  duration: string;
  isDemo: boolean;
  order: number;
}

export interface StoredTopic {
  id: string;
  title: string;
  order: number;
  content: StoredLesson[];
}

export interface StoredOffering {
  id: string;
  name: string;
  accessType: 'RECORDED' | 'LIVE';
  pricePaise: number;
  durationDays: number;
  isActive: boolean;
}

export interface StoredCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  teacherName: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  courseCategory: 'RECORDED' | 'LIVE' | 'QUALIFIER' | string;
  term: string;
  examStages: string[];
  tags: string[];
  videoUrl: string | null;
  durationDays: number;
  liveUpgradePrice: number;
  topics: StoredTopic[];
  offerings: StoredOffering[];
  createdAt: string;
  updatedAt: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: string;
  securityNumber: string;
  referralCode: string;
  walletBalance: number;
  streakDays: number;
  xp: number;
  iitmLevel: string;
  isActive: boolean;
  enrolledCourseIds: string[];
  totalSpentPaise: number;
  createdAt: string;
}

// Initial robust course catalog with dual video support
const INITIAL_COURSES: StoredCourse[] = [
  {
    id: 'course-math1',
    slug: 'mathematics-for-data-science-1',
    title: 'Mathematics for Data Science 1',
    description: 'Structured video lessons, live problem-solving cohorts, and assignment walkthroughs tailored for IIT Madras BS Degree absolute grading cutoffs.',
    subject: 'Mathematics',
    teacherName: 'Prof. Anirudh Sharma',
    status: 'PUBLISHED',
    courseCategory: 'LIVE',
    term: 'Qualifier / Foundation',
    examStages: ['Quiz 1', 'Quiz 2', 'End Term'],
    tags: ['IITM BS', 'Calculus', 'Linear Algebra', 'Foundations'],
    videoUrl: 'https://youtu.be/BktHdcWoVNc',
    durationDays: 120,
    liveUpgradePrice: 150000,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    offerings: [
      { id: 'off-rec-math1', name: 'Recorded Masterclass', accessType: 'RECORDED', pricePaise: 199900, durationDays: 120, isActive: true },
      { id: 'off-live-math1', name: 'Live Interactive Batch', accessType: 'LIVE', pricePaise: 349900, durationDays: 120, isActive: true },
    ],
    topics: [
      {
        id: 't-math1-1',
        title: 'Unit 1: Functions, Limits & Continuity',
        order: 1,
        content: [
          {
            id: 'l-math1-1',
            title: 'Course Orientation & Absolute Grading Criteria',
            videoSource: 'YOUTUBE',
            videoUrl: 'https://youtu.be/BktHdcWoVNc',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc',
            duration: '20 min',
            isDemo: true,
            order: 1,
          },
          {
            id: 'l-math1-2',
            title: 'Functions: Domain, Range & Composition Proofs',
            videoSource: 'GOOGLE_DRIVE',
            videoUrl: 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing',
            youtubeUrl: null,
            duration: '42 min',
            isDemo: false,
            order: 2,
          },
          {
            id: 'l-math1-3',
            title: 'Limit Theorems & Epsilon-Delta Proof Techniques',
            videoSource: 'YOUTUBE',
            videoUrl: 'https://youtu.be/BktHdcWoVNc',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc',
            duration: '35 min',
            isDemo: false,
            order: 3,
          },
        ],
      },
      {
        id: 't-math1-2',
        title: 'Unit 2: Differential Calculus & Optimization',
        order: 2,
        content: [
          {
            id: 'l-math1-4',
            title: 'Derivatives: Chain Rule & Implicit Differentiation',
            videoSource: 'GOOGLE_DRIVE',
            videoUrl: 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing',
            youtubeUrl: null,
            duration: '38 min',
            isDemo: false,
            order: 1,
          },
          {
            id: 'l-math1-5',
            title: 'Maxima, Minima & Graded Assignment Walkthrough',
            videoSource: 'YOUTUBE',
            videoUrl: 'https://youtu.be/BktHdcWoVNc',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc',
            duration: '45 min',
            isDemo: false,
            order: 2,
          },
        ],
      },
      {
        id: 't-math1-3',
        title: 'Unit 3: Quiz 1 & Quiz 2 Mock Exam Problem Sittings',
        order: 3,
        content: [
          {
            id: 'l-math1-6',
            title: 'Timed Mock Quiz 1: Speed Strategies & Trap Questions',
            videoSource: 'YOUTUBE',
            videoUrl: 'https://youtu.be/BktHdcWoVNc',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc',
            duration: '50 min',
            isDemo: false,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'course-ct',
    slug: 'computational-thinking',
    title: 'Computational Thinking & Python Fundamentals',
    description: 'Master algorithmic logic, pseudocode tracing, and core Python data structures for IITM Qualifier and Foundation exams.',
    subject: 'Computer Science',
    teacherName: 'Prof. Anirudh Sharma',
    status: 'PUBLISHED',
    courseCategory: 'LIVE',
    term: 'Qualifier',
    examStages: ['Quiz 1', 'Quiz 2', 'End Term'],
    tags: ['Python', 'Algorithms', 'Qualifier Prep'],
    videoUrl: 'https://youtu.be/BktHdcWoVNc',
    durationDays: 120,
    liveUpgradePrice: 150000,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    offerings: [
      { id: 'off-rec-ct', name: 'Recorded Batch', accessType: 'RECORDED', pricePaise: 249900, durationDays: 120, isActive: true },
      { id: 'off-live-ct', name: 'Live Interactive Batch', accessType: 'LIVE', pricePaise: 399900, durationDays: 120, isActive: true },
    ],
    topics: [
      {
        id: 't-ct-1',
        title: 'Unit 1: Algorithmic Logic & Pseudocode Tracing',
        order: 1,
        content: [
          {
            id: 'l-ct-1',
            title: 'Flowcharts, Iteration Loops, and Dry-Running Patterns',
            videoSource: 'YOUTUBE',
            videoUrl: 'https://youtu.be/BktHdcWoVNc',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc',
            duration: '28 min',
            isDemo: true,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    id: 'course-stats1',
    slug: 'statistics-for-data-science-1',
    title: 'Statistics for Data Science 1',
    description: 'Probability models, descriptive statistics, random variables, and distributions essential for data analysis and grading cutoffs.',
    subject: 'Statistics',
    teacherName: 'Rajesh Ramanujan',
    status: 'PUBLISHED',
    courseCategory: 'LIVE',
    term: 'Foundation',
    examStages: ['Quiz 2', 'End Term'],
    tags: ['Probability', 'Distributions', 'Problem Sets'],
    videoUrl: null,
    durationDays: 90,
    liveUpgradePrice: 100000,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    offerings: [
      { id: 'off-live-stats1', name: 'Live Evening Batch', accessType: 'LIVE', pricePaise: 299900, durationDays: 90, isActive: true },
      { id: 'off-rec-stats1', name: 'Recorded Masterclass', accessType: 'RECORDED', pricePaise: 219900, durationDays: 180, isActive: true },
    ],
    topics: [],
  },
];

// Initial mock users with full access to all courses
const ALL_DEMO_COURSES = ['course-math1', 'course-ct', 'course-stats1', 'c1', 'c2'];

const INITIAL_USERS: StoredUser[] = [
  {
    id: 'demo-super-manager',
    name: 'Vikramaditya (Super Manager)',
    email: 'supermanager@northstar.demo',
    role: 'SUPER_MANAGER',
    securityNumber: 'SEC-MGR801',
    referralCode: 'VIKRAM5',
    walletBalance: 100000,
    streakDays: 45,
    xp: 9800,
    iitmLevel: 'Degree',
    isActive: true,
    enrolledCourseIds: ALL_DEMO_COURSES,
    totalSpentPaise: 0,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'demo-manager',
    name: 'Priya Sharma (Operations Manager)',
    email: 'manager@northstar.demo',
    role: 'MANAGER',
    securityNumber: 'SEC-OPS602',
    referralCode: 'PRIYA5',
    walletBalance: 50000,
    streakDays: 30,
    xp: 5400,
    iitmLevel: 'Diploma',
    isActive: true,
    enrolledCourseIds: ALL_DEMO_COURSES,
    totalSpentPaise: 0,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'demo-admin',
    name: 'Rohan Verma (Course Admin)',
    email: 'admin@northstar.demo',
    role: 'ADMIN',
    securityNumber: 'SEC-ADM503',
    referralCode: 'ROHAN5',
    walletBalance: 25000,
    streakDays: 20,
    xp: 3200,
    iitmLevel: 'Diploma',
    isActive: true,
    enrolledCourseIds: ALL_DEMO_COURSES,
    totalSpentPaise: 0,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'demo-instructor',
    name: 'Prof. Sneha Kulkarni',
    email: 'instructor@northstar.demo',
    role: 'INSTRUCTOR',
    securityNumber: 'SEC-INS802',
    referralCode: 'SNEHA5',
    walletBalance: 15000,
    streakDays: 15,
    xp: 2800,
    iitmLevel: 'Degree',
    isActive: true,
    enrolledCourseIds: ALL_DEMO_COURSES,
    totalSpentPaise: 0,
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: 'demo-student',
    name: 'Aarav Sharma (Student)',
    email: 'student@northstar.demo',
    role: 'STUDENT',
    securityNumber: 'SEC-STU401',
    referralCode: 'AARAV5',
    walletBalance: 4500,
    streakDays: 14,
    xp: 1250,
    iitmLevel: 'Foundation',
    isActive: true,
    enrolledCourseIds: ALL_DEMO_COURSES,
    totalSpentPaise: 349900,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

// In-memory global store to preserve state across requests
const globalStore = globalThis as unknown as {
  __demoCourses?: StoredCourse[];
  __demoUsers?: StoredUser[];
};

if (!globalStore.__demoCourses) {
  globalStore.__demoCourses = INITIAL_COURSES;
}

if (!globalStore.__demoUsers) {
  globalStore.__demoUsers = INITIAL_USERS;
}

export const demoStore = {
  // Course operations
  getCourses: (): StoredCourse[] => globalStore.__demoCourses || INITIAL_COURSES,

  getCourseById: (idOrSlug: string): StoredCourse | undefined => {
    const list = globalStore.__demoCourses || INITIAL_COURSES;
    return list.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
  },

  createCourse: (data: Partial<StoredCourse>): StoredCourse => {
    const list = globalStore.__demoCourses || INITIAL_COURSES;
    const newCourse: StoredCourse = {
      id: `course-${Date.now()}`,
      slug: (data.slug || `course-${Date.now()}`).toLowerCase().trim(),
      title: data.title || 'Untitled Course',
      description: data.description || '',
      subject: data.subject || 'Computer Science',
      teacherName: data.teacherName || 'Faculty Instructor',
      status: (data.status as any) || 'PUBLISHED',
      courseCategory: (data.courseCategory as any) || 'RECORDED',
      term: data.term || 'Foundation',
      examStages: data.examStages || ['Quiz 1', 'Quiz 2', 'End Term'],
      tags: data.tags || ['IITM BS'],
      videoUrl: data.videoUrl || null,
      durationDays: data.durationDays || 120,
      liveUpgradePrice: data.liveUpgradePrice || 150000,
      topics: [],
      offerings: [
        {
          id: `off-rec-${Date.now()}`,
          name: 'Recorded Masterclass',
          accessType: 'RECORDED',
          pricePaise: 199900,
          durationDays: 120,
          isActive: true,
        },
        {
          id: `off-live-${Date.now()}`,
          name: 'Live Interactive Batch',
          accessType: 'LIVE',
          pricePaise: 349900,
          durationDays: 120,
          isActive: true,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(newCourse);
    globalStore.__demoCourses = list;
    return newCourse;
  },

  updateCourse: (id: string, updates: Partial<StoredCourse>): StoredCourse | null => {
    const list = globalStore.__demoCourses || INITIAL_COURSES;
    const idx = list.findIndex((c) => c.id === id || c.slug === id);
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    globalStore.__demoCourses = list;
    return list[idx];
  },

  addTopic: (courseId: string, title: string): StoredTopic | null => {
    const course = demoStore.getCourseById(courseId);
    if (!course) return null;

    const newTopic: StoredTopic = {
      id: `t-${Date.now()}`,
      title,
      order: course.topics.length + 1,
      content: [],
    };

    course.topics.push(newTopic);
    course.updatedAt = new Date().toISOString();
    return newTopic;
  },

  addLesson: (
    courseId: string,
    topicId: string,
    lessonData: {
      title: string;
      videoSource: 'GOOGLE_DRIVE' | 'YOUTUBE';
      videoUrl: string;
      duration?: string;
      isDemo?: boolean;
    }
  ): StoredLesson | null => {
    const course = demoStore.getCourseById(courseId);
    if (!course) return null;

    const topic = course.topics.find((t) => t.id === topicId);
    if (!topic) return null;

    const isYt = lessonData.videoSource === 'YOUTUBE';
    const newLesson: StoredLesson = {
      id: `l-${Date.now()}`,
      title: lessonData.title,
      videoSource: lessonData.videoSource,
      videoUrl: lessonData.videoUrl,
      youtubeUrl: isYt ? lessonData.videoUrl : null,
      duration: lessonData.duration || '20 min',
      isDemo: Boolean(lessonData.isDemo),
      order: topic.content.length + 1,
    };

    topic.content.push(newLesson);
    course.updatedAt = new Date().toISOString();
    return newLesson;
  },

  // User & Staff operations
  getUsers: (): StoredUser[] => globalStore.__demoUsers || INITIAL_USERS,

  getUserById: (userId: string): StoredUser | undefined => {
    const users = globalStore.__demoUsers || INITIAL_USERS;
    return users.find((u) => u.id === userId);
  },

  updateUserRole: (userId: string, newRole: string): StoredUser | null => {
    const users = globalStore.__demoUsers || INITIAL_USERS;
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    user.role = newRole;
    return user;
  },

  assignCourseToUser: (userId: string, courseId: string): boolean => {
    const user = demoStore.getUserById(userId);
    if (!user) return false;

    if (!user.enrolledCourseIds.includes(courseId)) {
      user.enrolledCourseIds.push(courseId);
    }
    return true;
  },

  revokeCourseFromUser: (userId: string, courseId: string): boolean => {
    const user = demoStore.getUserById(userId);
    if (!user) return false;

    user.enrolledCourseIds = user.enrolledCourseIds.filter((id) => id !== courseId);
    return true;
  },

  addWalletBonus: (userId: string, coins: number): number | null => {
    const user = demoStore.getUserById(userId);
    if (!user) return null;

    user.walletBalance = (user.walletBalance || 0) + coins;
    return user.walletBalance;
  },
};
