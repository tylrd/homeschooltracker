# Product Requirements Document: HomeschoolTracker

## 1. Product Vision

To build a mobile-first application that removes the administrative mental load of homeschooling. It allows the parent to plan quickly, track progress effortlessly, and adapt to the inevitable chaos of daily life (sick days, unexpected trips) without feeling "behind."

**Core Philosophy:** "Plan in minutes, log in seconds."

## 2. Target User Persona

* **Role:** The Primary Educator (Mom).
* **Context:** Teaching 3 children simultaneously at different grade levels. Has her hands full (literally and metaphorically).
* **Pain Points:**
* Forgetting what lesson comes next.
* Losing track of attendance (required by state law).
* The "Domino Effect": If Tuesday is missed, manually shifting every subsequent lesson in a spreadsheet is a nightmare.
* Complex software that requires a desktop computer.



---

## 3. Core Feature Set (MVP - Minimum Viable Product)

### A. Student Management (The "Three Kids")

* **Profiles:** Create a profile for each child (Name, Grade Level).
* **Color Coding:** Assign a distinct color to each child (e.g., Kid A = Blue, Kid B = Red, Kid C = Green). This color pervades the UI for instant visual recognition.

### B. The "Shelf" (Curriculum Management)

* **Resource Entry:** Input subjects (Math, History, Reading) and Resources (e.g., "Saxon Math 5/4").
* **Lesson Batches:** Ability to auto-generate lessons.
* *Example:* "Create lessons 1 through 100 for Math."
* *Why:* Prevents entering daily tasks manually every morning.



### C. The Daily Dashboard (Home Screen)

This is the most critical screen. It must look like a simple checklist, not a calendar.

* **Toggle View:** Switch between "All Kids" or filter by specific child.
* **Task List:** Shows only what is due *today*.
* **One-Tap Completion:** A large checkbox or swipe gesture to mark a lesson as done.
* **The "Notes" Button:** A quick icon next to every task to jot down a sentiment (e.g., "Struggled with multiplication" or "Needs extra practice").

### D. The "Life Happens" Feature (Crucial)

* **The "Bump" Button:** If a lesson isn't finished today, the user can swipe or click "Bump."
* **Logic:** This automatically moves the lesson to the next available school day and shifts all subsequent lessons for that subject forward.
* **Reschedule All:** A "Sick Day" button that bumps *everything* from today to tomorrow.

### E. Reporting & Admin

* **Attendance Log:** Auto-generates based on activity. If a task was completed, the child is marked "Present."
* **PDF Export:** A simple button to export a "term report" or "attendance sheet" for state evaluators.

---

## 4. User Experience (UX/UI) Requirements

### Mobile-First Design Principles

1. **Thumb Zone Navigation:** All primary actions (Complete, Bump, Add Note) must be reachable with a thumb at the bottom of the screen.
2. **Visual Clarity:** High contrast. Large text. No tiny links.
3. **Minimal Typing:** Use dropdowns, spinners, and presets wherever possible.

### Key User Flows

**Flow 1: The Morning Check**

> User opens app -> Sees "Today's Plan" -> Verifies list -> Hands out books.

**Flow 2: The Afternoon Log**

> User opens app -> Taps "Check" on Math for Kid 1 -> Taps "Check" on History for Kid 2 -> Kid 3 didn't finish Science -> User swipes left on Science to "Bump to Tomorrow" -> Done.

**Flow 3: The Planning Session (Sunday Night)**

> User goes to "Calendar View" -> Drags "Field Trip" onto Friday -> App asks "Bump Friday's lessons to Monday?" -> User clicks "Yes."

---

## 5. Technical Data Structure (Simplified)

To keep this fast, here is a suggested basic relationship structure:

* **Students:** (ID, Name, Color)
* **Subjects:** (ID, Name, Student_ID)
* **Resources:** (ID, Name, Subject_ID)
* **Lessons:** (ID, Resource_ID, Lesson_Number/Title, Status [Planned, Completed, Bumped], Scheduled_Date, Completion_Date)
* **Daily_Notes:** (ID, Student_ID, Date, Content)

---

## 6. Future "Nice-to-Haves" (Not for MVP)

* **Gamification:** Kids get digital stars/badges for finishing streaks.
* **Photos:** Upload a photo of the worksheet to the specific lesson record (digital portfolio).
* **Grading:** Calculating GPAs (usually not needed until High School).
* **Google Calendar Sync:** overlaying school tasks on the family calendar.
