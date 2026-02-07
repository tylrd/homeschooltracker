import { getDb, getSql } from "@/db";
import {
  dailyNotes,
  lessons,
  resources,
  students,
  subjects,
} from "@/db/schema";
import { generateLessonDates, toDateString } from "@/lib/dates";

// ── Seed Data ───────────────────────────────────────────────────────────────

const STUDENTS = [
  { name: "Emma", color: "rose", gradeLevel: "5th Grade" },
  { name: "Liam", color: "sky", gradeLevel: "3rd Grade" },
  { name: "Sophie", color: "emerald", gradeLevel: "1st Grade" },
] as const;

const CURRICULUM: Record<
  string,
  { subjects: { name: string; resources: string[] }[] }
> = {
  Emma: {
    subjects: [
      { name: "Math", resources: ["Saxon Math 5/4"] },
      {
        name: "Reading",
        resources: ["Literature Pockets: Greek & Roman Myths"],
      },
      { name: "Science", resources: ["Real Science Odyssey Biology"] },
      { name: "History", resources: ["Story of the World Vol. 2"] },
      {
        name: "Writing",
        resources: ["Institute for Excellence in Writing Level B"],
      },
    ],
  },
  Liam: {
    subjects: [
      { name: "Math", resources: ["Singapore Math 3A"] },
      { name: "Reading", resources: ["All About Reading Level 3"] },
      {
        name: "Science",
        resources: ["Building Foundations of Scientific Understanding"],
      },
      { name: "History", resources: ["Story of the World Vol. 1"] },
    ],
  },
  Sophie: {
    subjects: [
      { name: "Math", resources: ["RightStart Math Level B"] },
      {
        name: "Reading",
        resources: ["Teach Your Child to Read in 100 Easy Lessons"],
      },
      { name: "Phonics", resources: ["Explode the Code Book 1"] },
      { name: "Science", resources: ["Nature Study Journal"] },
    ],
  },
};

const DAILY_NOTES_TEMPLATES = [
  "Great focus today! Finished all assignments ahead of schedule.",
  "Struggled a bit with the math lesson but worked through it.",
  "Field trip to the science museum — counted as science and history.",
  "Read independently for 45 minutes after finishing schoolwork.",
  "Sick day — will catch up tomorrow.",
  "Co-op day: art class and group science experiment.",
];

const MON_FRI = [1, 2, 3, 4, 5];

// ── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  const db = getDb();
  const sql = getSql();
  console.log("Seeding database...\n");

  // Clear existing data (reverse dependency order)
  await db.delete(dailyNotes);
  await db.delete(lessons);
  await db.delete(resources);
  await db.delete(subjects);
  await db.delete(students);
  console.log("Cleared existing data.");

  const today = new Date();
  const todayStr = toDateString(today);

  // Start date: ~4 weeks ago on a Monday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 28);
  // Rewind to Monday
  while (startDate.getDay() !== 1) {
    startDate.setDate(startDate.getDate() - 1);
  }

  let studentCount = 0;
  let subjectCount = 0;
  let resourceCount = 0;
  let lessonCount = 0;
  let noteCount = 0;

  for (const studentData of STUDENTS) {
    // Insert student
    const [student] = await db
      .insert(students)
      .values({
        name: studentData.name,
        color: studentData.color,
        gradeLevel: studentData.gradeLevel,
      })
      .returning({ id: students.id });
    studentCount++;

    const curriculum = CURRICULUM[studentData.name];

    for (const subjectData of curriculum.subjects) {
      // Insert subject
      const [subject] = await db
        .insert(subjects)
        .values({
          name: subjectData.name,
          studentId: student.id,
        })
        .returning({ id: subjects.id });
      subjectCount++;

      for (const resourceName of subjectData.resources) {
        // Insert resource
        const [resource] = await db
          .insert(resources)
          .values({
            name: resourceName,
            subjectId: subject.id,
          })
          .returning({ id: resources.id });
        resourceCount++;

        // Generate 25 lessons on weekdays starting from startDate
        const lessonDates = generateLessonDates(startDate, 25, MON_FRI);

        const lessonValues = lessonDates.map((date, i) => {
          const dateStr = toDateString(date);
          const isPast = dateStr < todayStr;
          const isCompleted = isPast && Math.random() < 0.8;

          return {
            resourceId: resource.id,
            lessonNumber: i + 1,
            title: `Lesson ${i + 1}`,
            status: isCompleted ? ("completed" as const) : ("planned" as const),
            scheduledDate: dateStr,
            completionDate: isCompleted ? dateStr : null,
          };
        });

        await db.insert(lessons).values(lessonValues);
        lessonCount += lessonValues.length;
      }
    }

    // Insert a few daily notes for past school days
    const noteDates = generateLessonDates(startDate, 5, MON_FRI);
    const noteValues = noteDates
      .filter((d) => toDateString(d) < todayStr)
      .slice(0, 3)
      .map((date, i) => ({
        studentId: student.id,
        date: toDateString(date),
        content: DAILY_NOTES_TEMPLATES[i % DAILY_NOTES_TEMPLATES.length],
      }));

    if (noteValues.length > 0) {
      await db.insert(dailyNotes).values(noteValues);
      noteCount += noteValues.length;
    }
  }

  console.log("\nSeed complete:");
  console.log(`  Students:    ${studentCount}`);
  console.log(`  Subjects:    ${subjectCount}`);
  console.log(`  Resources:   ${resourceCount}`);
  console.log(`  Lessons:     ${lessonCount}`);
  console.log(`  Daily Notes: ${noteCount}`);

  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
