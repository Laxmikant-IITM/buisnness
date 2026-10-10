"use client";

import { useMemo, useState } from "react";

type Section = "discover" | "courses" | "quiz" | "learning";

// Fictional sample content keeps this prototype useful without implying a live catalog.
const courses = [
  { title: "Build your first web experience", subject: "Technology", level: "Beginner", lessons: 18, tone: "mint", number: "01" },
  { title: "Think clearly with data", subject: "Data & business", level: "All levels", lessons: 12, tone: "peach", number: "02" },
  { title: "Design systems, from zero", subject: "Design", level: "Intermediate", lessons: 16, tone: "lilac", number: "03" },
  { title: "Make better money decisions", subject: "Data & business", level: "Beginner", lessons: 9, tone: "blue", number: "04" },
];
const categories = ["Everything", "Technology", "Design", "Data & business"];
const answers = ["It converts source code into machine code.", "It provides styles and visual layout rules.", "It defines the structure and meaning of page content.", "It stores user data in a remote database."];

function Brand() {
  return <a className="brand" href="#top" aria-label="Northstar learning, home"><span className="brand-icon" aria-hidden="true">n</span>northstar<span className="brand-period">.</span></a>;
}

export default function Home() {
  const [category, setCategory] = useState("Everything");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<Section>("discover");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  // Filtering and answer selection stay in this browser; no account or learning data is saved.
  const shown = useMemo(() => courses.filter((course) =>
    (category === "Everything" || course.subject === category) &&
    `${course.title} ${course.subject}`.toLowerCase().includes(query.toLowerCase())), [category, query]);

  const goTo = (section: Section) => {
    setView(section);
    if (section === "courses") requestAnimationFrame(() => document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" }));
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <main className="shell" id="top">
    <header className="nav-bar">
      <Brand />
      <nav className="nav-links" aria-label="Main navigation">
        <button aria-current={view === "discover" ? "page" : undefined} className={view === "discover" ? "nav-active" : ""} onClick={() => goTo("discover")}>Home</button>
        <button aria-current={view === "courses" ? "page" : undefined} className={view === "courses" ? "nav-active" : ""} onClick={() => goTo("courses")}>Courses</button>
        <button aria-current={view === "quiz" ? "page" : undefined} className={view === "quiz" ? "nav-active" : ""} onClick={() => goTo("quiz")}>Practice</button>
        <button aria-current={view === "learning" ? "page" : undefined} className={view === "learning" ? "nav-active" : ""} onClick={() => goTo("learning")}>My learning</button>
      </nav>
      <div className="nav-cta"><span className="prototype-chip">PRODUCT PREVIEW</span><button className="button dark small" onClick={() => goTo("courses")}>Explore <span aria-hidden="true">↗</span></button></div>
    </header>

    {view === "discover" || view === "courses" ? <>
      {view === "discover" && <>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-text"><p className="eyebrow"><span aria-hidden="true">✳</span> LEARN AT YOUR OWN PACE</p><h1 id="hero-title">Make room for<br/><i>what’s next.</i></h1><p className="intro">Thoughtful courses and focused practice for curious people. Learn useful skills, one clear step at a time.</p><div className="hero-buttons"><button className="button dark" onClick={() => goTo("courses")}>Explore courses <span aria-hidden="true">↗</span></button><button className="under-link" onClick={() => goTo("quiz")}>Try a sample question <span aria-hidden="true">→</span></button></div><p className="hero-caption"><span aria-hidden="true"></span>A calm place to keep growing.</p></div>
          <div className="hero-art" role="img" aria-label="Abstract illustration for the Northstar learning preview"><div className="art-top"><span>FIELD NOTES / 01</span><span>LEARNING, WELL PLACED</span></div><div className="art-circle"></div><div className="art-sun"></div><div className="floating-card"><p><b></b> A GOOD PLACE TO BEGIN</p><strong>Small steps.<br/><i>Real momentum.</i></strong><div>YOUR LEARNING SPACE <span aria-hidden="true">✳</span></div></div><span className="art-side-note">Curiosity looks<br/>good on you.</span><span className="art-count">01 — 04</span></div>
        </section>
        <section className="principles" aria-label="Learning principles"><div><b>01</b><span>Learn in focused<br/>short sessions</span></div><div><b>02</b><span>Keep your progress<br/>in one place</span></div><div><b>03</b><span>Return whenever<br/>you’re ready</span></div><small>Concept preview · Sample content</small></section>
      </>}

      <section className="catalog" id="courses" aria-labelledby="courses-title"><div className="section-top"><div><p className="eyebrow">A LITTLE OF EVERYTHING</p><h2 id="courses-title">Find your next<br/><i>good question.</i></h2></div><p>Explore sample courses and short practice prompts in this product concept.</p></div><div className="filters"><div className="pills" role="group" aria-label="Filter preview courses">{categories.map((item) => <button key={item} aria-pressed={category === item} className={category === item ? "pill active" : "pill"} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a course" aria-label="Search preview courses"/></label></div>
        <div className="course-grid" aria-live="polite">{shown.map((course) => <article className="course" key={course.title}><div className={`course-art ${course.tone}`}><span className="sample-label">PREVIEW COURSE</span><span className="course-number">{course.number}</span><span className="rings" aria-hidden="true"></span><span className="spark" aria-hidden="true">✳</span></div><div className="course-info"><div className="course-tags"><span>{course.subject}</span><span>{course.level}</span></div><h3>{course.title}</h3><div className="course-detail"><span>{course.lessons} short lessons</span><span>Sample course</span></div><button className="text-button" onClick={() => goTo("learning")}>View learning preview <span aria-hidden="true">→</span></button></div></article>)}</div>{shown.length === 0 && <p className="no-results" role="status">No preview courses match that search.</p>}<div className="catalog-bottom"><span>More paths are taking shape.</span><button onClick={() => goTo("quiz")}>Try a sample question <b aria-hidden="true">→</b></button></div>
      </section>
      {view === "discover" && <>
        <section className="practice-teaser" aria-labelledby="practice-title"><div><p className="eyebrow">LEARN BY DOING</p><h2 id="practice-title">A quick question<br/>can open <i>a new path.</i></h2><p>Practice prompts can sit alongside lessons, helping learners check what they understand as they go.</p><button className="button dark" onClick={() => goTo("quiz")}>Try a sample question <span aria-hidden="true">→</span></button></div><article className="question-teaser"><div className="question-meta"><span>QUESTION PREVIEW</span><span>01 / 04</span></div><p>What does HTML mainly describe on a web page?</p><div className="answer-line"><span>A</span>Page structure and meaning</div><div className="answer-line muted"><span>B</span>Visual styles and colors</div><small>Sample content · no score is recorded</small></article></section>
        <section className="approach" id="approach"><span className="approach-star" aria-hidden="true">✳</span><div><p className="eyebrow">A BETTER WAY TO BEGIN</p><h2>Learning should fit<br/>into <i>your life.</i></h2><p className="approach-copy">Clear lessons. A place to pick up where you left off. Enough space to explore something new without feeling behind.</p><button className="text-button" onClick={() => goTo("courses")}>Find a place to start <b aria-hidden="true">→</b></button></div><aside><small>THE NORTHSTAR NOTE</small><p>“Make progress feel<br/>possible again.”</p><small className="stamp">N° 001<br/>ALWAYS LEARNING</small></aside></section>
      </>}
    </> : view === "quiz" ? <section className="quiz-page" aria-labelledby="quiz-title"><div className="quiz-heading"><p className="eyebrow">PRACTICE / PREVIEW</p><h1 id="quiz-title">Learn by <i>trying.</i></h1><p>Short questions can help you revisit a concept. This sample interaction runs locally and does not calculate or save a score.</p></div><div className="quiz-layout"><article className="quiz-card"><div className="quiz-card-top"><span>WEB FOUNDATIONS</span><span>QUESTION 01 · SAMPLE</span></div><div className="quiz-progress"><span></span></div><h2>What does HTML mainly describe on a web page?</h2><p className="quiz-hint">Choose one response to preview the interaction.</p><div className="answer-list" role="group" aria-label="Choose a sample answer">{answers.map((answer, index) => <button key={answer} className={`answer-option${selectedAnswer === index ? " selected" : ""}`} aria-pressed={selectedAnswer === index} onClick={() => setSelectedAnswer(index)}><span>{String.fromCharCode(65 + index)}</span>{answer}<i aria-hidden="true">{selectedAnswer === index ? "✓" : ""}</i></button>)}</div>{selectedAnswer !== null && <p className="selection-note" role="status">Response selected for preview. Answer checking and scoring are not connected.</p>}<div className="quiz-actions"><span>1 of 4 · sample questions</span><button className="button dark small" onClick={() => setSelectedAnswer(null)}>Reset answer</button></div></article><aside className="quiz-aside"><span className="aside-star" aria-hidden="true">✳</span><p className="eyebrow">A SMALL STEP</p><h2>Try, reflect,<br/><i>try again.</i></h2><p>In the finished product, practice could connect to courses, track attempts, and adapt to a learner’s progress.</p><button className="text-button" onClick={() => goTo("courses")}>Browse sample courses <b aria-hidden="true">→</b></button><small>PREVIEW CONTENT · NOT A LIVE ASSESSMENT</small></aside></div></section> : <section className="dashboard" aria-labelledby="learning-title"><div className="dashboard-intro"><p className="eyebrow">YOUR SPACE / PREVIEW</p><h1 id="learning-title">Good to have<br/><i>you here.</i></h1><p>This is a sample learner space. Sign-in, course access, and saved progress are not connected yet.</p><button className="button dark" onClick={() => goTo("courses")}>Browse sample courses <span aria-hidden="true">↗</span></button></div><div className="dash-panel"><div className="dash-heading"><div><small>YOUR LEARNING</small><h2>Pick up a thread</h2></div><small>PREVIEW</small></div><article className="continue"><div className="continue-art"><span>PREVIEW COURSE</span><b>01</b><i aria-hidden="true">✳</i></div><div className="continue-info"><small>TECHNOLOGY · BEGINNER</small><h3>Build your first web experience</h3><p>Sample course · progress illustration</p><div className="progress" aria-label="Illustrative progress, not saved"><span/></div><div className="progress-label"><span>Lesson 3 of 18</span><span>16% explored</span></div><button className="button dark small" onClick={() => goTo("quiz")}>Try a question <span aria-hidden="true">→</span></button></div></article><p className="dashboard-foot">Your course library, quiz attempts, and progress will appear here after account and learning services are connected.</p></div></section>}

    <section className="closing"><div><p className="eyebrow">A NOTE FOR THE CURIOUS</p><h2>Good things grow<br/>with <i>practice.</i></h2></div><p>A fresh learning space is in the making. This preview shows the direction, not live courses, accounts, or offers.</p><button className="button outline" onClick={() => goTo("discover")}>Back to the top <span aria-hidden="true">↗</span></button></section>
    <footer><Brand /><span>New learning, thoughtfully made.</span><small>PRODUCT PREVIEW · 2026</small></footer>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {([ ["discover", "⌂", "Home"], ["courses", "▤", "Courses"], ["quiz", "✳", "Practice"], ["learning", "◉", "Learning"] ] as [Section, string, string][]).map(([section, icon, label]) => <button key={section} aria-current={view === section ? "page" : undefined} className={view === section ? "current" : ""} onClick={() => goTo(section)}><b aria-hidden="true">{icon}</b>{label}</button>)}
    </nav>
  </main>;
}
