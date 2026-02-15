import { eq } from "drizzle-orm";
import { getDb, getSql } from "@/db";
import {
  BOOTSTRAP_ORGANIZATION_ID,
  dailyNotes,
  lessons,
  members,
  organizations,
  resources,
  students,
  subjects,
  userDefaultOrganizations,
  users,
} from "@/db/schema";
import { auth } from "@/lib/auth";
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
const SEED_USER_EMAIL = "test@test.me";
const SEED_USER_PASSWORD = "password";
const SEED_USER_NAME = "test";

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

  await db
    .insert(organizations)
    .values({
      id: BOOTSTRAP_ORGANIZATION_ID,
      name: "My Homeschool",
      slug: "bootstrap-organization",
    })
    .onConflictDoUpdate({
      target: organizations.id,
      set: {
        name: "My Homeschool",
      },
    });

  // Reset and recreate deterministic test auth user.
  const existingSeedUser = await db.query.users.findFirst({
    where: eq(users.email, SEED_USER_EMAIL),
  });

  if (existingSeedUser) {
    await db.delete(users).where(eq(users.id, existingSeedUser.id));
  }

  await auth.api.signUpEmail({
    body: {
      email: SEED_USER_EMAIL,
      password: SEED_USER_PASSWORD,
      name: SEED_USER_NAME,
    },
  });

  const seededUser = await db.query.users.findFirst({
    where: eq(users.email, SEED_USER_EMAIL),
  });

  if (!seededUser) {
    throw new Error("Failed to create seeded auth user.");
  }

  await db
    .insert(members)
    .values({
      userId: seededUser.id,
      organizationId: BOOTSTRAP_ORGANIZATION_ID,
      role: "owner",
    })
    .onConflictDoNothing({ target: [members.organizationId, members.userId] });

  await db
    .insert(userDefaultOrganizations)
    .values({
      userId: seededUser.id,
      organizationId: BOOTSTRAP_ORGANIZATION_ID,
    })
    .onConflictDoUpdate({
      target: userDefaultOrganizations.userId,
      set: {
        organizationId: BOOTSTRAP_ORGANIZATION_ID,
        updatedAt: new Date(),
      },
    });

  const today = new Date();
  // Start all generated dates from today onward.
  const startDate = new Date(today);

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
        organizationId: BOOTSTRAP_ORGANIZATION_ID,
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
          organizationId: BOOTSTRAP_ORGANIZATION_ID,
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
            organizationId: BOOTSTRAP_ORGANIZATION_ID,
            name: resourceName,
            subjectId: subject.id,
          })
          .returning({ id: resources.id });
        resourceCount++;

        // Generate 25 lessons on weekdays starting from startDate
        const lessonDates = generateLessonDates(startDate, 25, MON_FRI);

        const lessonValues = lessonDates.map((date, i) => {
          const dateStr = toDateString(date);
          return {
            organizationId: BOOTSTRAP_ORGANIZATION_ID,
            resourceId: resource.id,
            lessonNumber: i + 1,
            title: `Lesson ${i + 1}`,
            status: "planned" as const,
            scheduledDate: dateStr,
            completionDate: null,
          };
        });

        await db.insert(lessons).values(lessonValues);
        lessonCount += lessonValues.length;
      }
    }

    // Insert a few daily notes from today onward
    const noteDates = generateLessonDates(startDate, 5, MON_FRI);
    const noteValues = noteDates.slice(0, 3).map((date, i) => ({
      organizationId: BOOTSTRAP_ORGANIZATION_ID,
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
  console.log(`  Auth User:   ${SEED_USER_EMAIL} / ${SEED_USER_PASSWORD}`);

  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
