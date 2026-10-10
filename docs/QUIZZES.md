# Quiz and question API foundation

This module adds an initial assessment backend to the new LMS project. It uses
the new LMS database and session; it does not import Exam GenZ code or data.
The initial migration file exists in `prisma/migrations/`, but it has not been
applied to a database.

## Supported question formats

- `MULTIPLE_CHOICE_SINGLE`: exactly one correct choice.
- `MULTIPLE_CHOICE_MULTI`: one or more correct choices, with at least one distractor. Scoring uses exact-set matching; partial credit is not awarded.
- `TRUE_FALSE`: exactly two choices and one correct choice.

Prompts and choices are plain text. Rich media, question revision history,
question edit/archive endpoints, negative marks, partial credit, randomized
question pools, and manual grading are future work.

## Role and answer-key boundaries

- Every request requires the current active LMS session.
- Platform managers can manage quizzes across courses. Admins can manage only assigned courses. Instructors can read assigned-course materials but cannot create or publish. Students can start attempts only with an active enrollment.
- Learner access also requires the course itself to be `PUBLISHED`; managers and assigned staff may work in authorized draft courses.
- Draft creation, item replacement, and publishing use `canManageCourse` from the shared auth module.
- Learner quiz and attempt responses omit correctness flags, explanations, and answer keys. The publish endpoint snapshots question content and keys so later question bank changes cannot change an existing published quiz.
- The API grades on the server. The client submits selected choice IDs only; submitted scores are never trusted.
- Attempt answer autosaves contain no score. A final submission closes the attempt. Time limits and maximum attempts are enforced on the server.
- Autosave and submit lock the attempt row in a serializable transaction. Draft item replacement and publishing lock the quiz row and verify its draft status inside the transaction, preventing late writes from undoing grading or altering a published quiz.

## Endpoints

| Method and path | Purpose |
|---|---|
| `GET /api/courses/:courseId/questions` | List a course bank; learners do not receive correct-answer flags. |
| `POST /api/courses/:courseId/questions` | Add a validated question; requires course-management access. |
| `GET /api/courses/:courseId/quizzes` | List published learner quizzes, or staff drafts for assigned staff. |
| `POST /api/courses/:courseId/quizzes` | Create a draft quiz. |
| `GET /api/quizzes/:quizId` | Read quiz details; learners receive sanitized published questions. |
| `PATCH /api/quizzes/:quizId` | Edit draft quiz settings. Published quizzes are immutable. |
| `PUT /api/quizzes/:quizId/items` | Replace the draft's ordered questions, restricted to its course. |
| `POST /api/quizzes/:quizId/publish` | Validate and snapshot all questions, then publish the quiz. |
| `POST /api/quizzes/:quizId/attempts` | Start a learner attempt and save its stable randomized presentation order. |
| `GET /api/quiz-attempts/:attemptId` | Get only the current learner's attempt and sanitized questions. |
| `PUT /api/quiz-attempts/:attemptId` | Autosave selected choice IDs without calculating or returning correctness. |
| `POST /api/quiz-attempts/:attemptId/submit` | Server-grade and close the attempt; returns final score and review feedback. |

Requests use JSON. Question creation accepts `{ prompt, type, explanation?, difficulty?, tags?, choices: [{ text, isCorrect }] }`. Draft quiz creation accepts `{ title, description?, timeLimitSeconds?, maxAttempts?, passMarkPercent?, shuffleQuestions?, shuffleChoices? }`. Item replacement accepts an array of `{ questionId, order, points? }`. Attempt save and submit accept `{ answers: [{ quizItemId, selectedChoiceIds }] }`.

## Integration gaps before launch

These handlers define the initial API contract; the quiz UI and Flutter client
still need to call them. Review and apply the initial migration against the
new empty database before the endpoints can run against persistent data. The
course authoring flow must create/publish courses and assign scoped staff.
Add question edit/archive and quiz revision workflows before content owners
need to correct published material. Add rate limits, audit entries, retention
rules, attempt analytics, and end-to-end payment/enrollment integration before
production launch.
