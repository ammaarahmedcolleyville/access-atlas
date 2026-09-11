# Student Contributions

This file is an honest, running record of what I (the student) actually decided, tested, learned, and changed on this project. Technical implementation (data pipeline code, frontend code, documentation drafting) was done with heavy AI assistance (Claude). This file exists to keep a clear, truthful line between "what Claude implemented" and "what I decided and did" — so nothing here should ever be inflated or invented.

**How to use this file:** add a new dated entry every time you make a real decision, run a real test, receive real feedback, or learn something non-obvious. Don't backfill entries for things that didn't happen.

---

## 2026-09-11 — Project selection and setup

- **Decision:** Reviewed 10 candidate Health Informatics project concepts (brainstormed by Claude, with explicit evaluation against relevance, technical sophistication, real-world usefulness, originality, feasibility, data availability, user-testing potential, future potential, and essay material) and chose **Texas Healthcare Access Atlas** over the alternatives (Maternal Health Deserts Tracker, Nursing Home Quality Compare).
- **Decision:** Chose the project name **"Access Atlas"** over the alternative "HealthGap TX."
- **Decision:** Chose to build the project in a dedicated folder (`access-atlas/`) rather than directly in the home directory, to keep it cleanly separated as its own git repository.
- **What I learned:** The initial data exploration surfaced a genuinely striking, real statistic — 93% of Texas counties currently have at least one active federal primary care shortage designation, covering 95% of the state's population, and there's a 16-year life-expectancy gap between the state's highest- and lowest-life-expectancy counties (Concho vs. Red River). This shaped the site's homepage messaging.

---

## 2026-09-11 — About page copy, QA pass, and Formspree setup

- Wrote and revised the "Why I built this" paragraph on the About page. Final version deliberately does not name a specific school or major — I'm applying to multiple schools with different intended majors, and a page naming one specific program could look inconsistent to a different admissions office reading a different application.
- Caught two real errors on the live About page and had them corrected: (1) it called Concho and Red River counties "neighboring" in the life-expectancy stat — they aren't, they're just the state's highest- and lowest-life-expectancy counties; (2) it claimed the site had already been "tested with a small number of real users," which wasn't true at the time since no testing had happened yet.
- Signed up for a free Formspree account myself and created the feedback form endpoint, so real submissions from usability testers will actually reach me.

## YYYY-MM-DD — Usability test session #1

- **Who:** (role/background, not their name)
- **Task results:** which of the 5 tasks in `documentation/USER_TESTING.md` succeeded, which didn't
- **What confused them:**
- **My categorization of their feedback:** (Clarity / Functionality / Accessibility / Trust / Feature request / Visual / Praise)
- **Decision:** what I changed as a result, or why I decided not to change anything

## YYYY-MM-DD — Feedback form responses (round 1)

- **Number of responses:**
- **Themes:**
- **Changes made in response:**
- **Changes explicitly NOT made, and why:**

## YYYY-MM-DD — What I'd do next

- Feature ideas, data sources I'd add, things I'd redesign if I kept working on this.
