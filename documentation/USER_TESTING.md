# User Testing

This document is the working plan for testing Access Atlas with real people. It covers three things: how to run a test session, how to categorize what comes back, and how to decide what to actually change. The public-facing survey itself lives at `docs/feedback.html`.

## 1. Usability testing plan

**Goal:** find out whether a first-time visitor — with no health-informatics background — can understand what the site is telling them and find specific information without help.

**Who to test with (aim for 5–8 people, not a huge sample):**
- At least 1–2 people with no connection to healthcare or data (the general-public baseline)
- At least 1 person who knows Texas geography well (to sanity-check whether the map is legible/usable)
- If possible, 1 person with some accessibility need (screen reader user, low vision, keyboard-only) — even a single session surfaces real barriers
- Optional: 1 person with a healthcare/public-health background, to sanity-check that the terminology is accurate, not just accessible

**Format:** ~10–15 minutes, in person or over a call, screen-shared if remote. Think-aloud protocol: ask the tester to narrate what they're looking at and thinking as they go, and resist the urge to explain or help unless they're fully stuck.

**Tasks to give them** (don't explain the site first — that's the point):
1. "Without me explaining anything, tell me what you think this website is for."
2. "Find out whether the county you live in (or grew up in) has an active healthcare shortage designation."
3. "Compare that county to one other county of your choice."
4. "Find out where this data actually comes from, and tell me one thing the site says it *can't* tell you."
5. Open-ended: "Was there anything confusing, or anything you expected to see that wasn't there?"

**What to record for each session:** which tasks succeeded without help, where they got stuck (exact page/element), any words they didn't understand, and their unprompted first reaction to Task 1.

Then have them fill out `docs/feedback.html` themselves — comparing what they told you out loud to what they wrote down is often revealing on its own.

## 2. Feedback categories

Every piece of feedback — from the form or from a live session — gets sorted into exactly one primary category:

| Category | Examples |
|---|---|
| **Clarity** | Confusing label, unclear term (HPSA, age-adjusted), unclear what a number means |
| **Functionality** | Something didn't work — map didn't load, dropdown did nothing, broken link |
| **Accessibility** | Hard to read (contrast/size), keyboard trap, screen reader confusion, touch targets too small |
| **Trust/credibility** | Tester doubted the data, wanted more citation, felt the site oversold what it can claim |
| **Feature request** | Something genuinely useful that doesn't exist yet |
| **Visual/design** | Layout, spacing, visual hierarchy — doesn't affect whether it works, just how it feels |
| **Praise** | Worth keeping track of too — it tells you what *not* to change |

## 3. Deciding what to change

Not all feedback should turn into a change. Use this order of priority:

1. **Fix immediately:** anything in *Functionality* or *Accessibility* that blocks a task — these are bugs, not opinions.
2. **Fix if more than one person hits it:** *Clarity* issues. One person misreading a label might be that person; three people misreading the same label is the label's fault.
3. **Consider for the next version:** *Feature request* and *Visual/design* items — log them, but don't let scope creep into v1. A good filter: does this feature request come from a real task someone was actually trying to do, or is it a nice-to-have someone thought of?
4. **Treat *Trust/credibility* feedback as highest priority regardless of frequency** — even one person doubting the data's honesty is a signal the Methodology/Limitations language isn't doing its job, since the whole point of this project is to be trustworthy about what it does and doesn't show.

Every real round of feedback collected should get a dated entry in `STUDENT_CONTRIBUTIONS.md`: what came in, which category, what (if anything) changed as a result, and why.
