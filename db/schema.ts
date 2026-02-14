import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────

export const lessonStatusEnum = pgEnum("lesson_status", [
  "planned",
  "completed",
  "bumped",
]);

// ── Tables ─────────────────────────────────────────────────────────────────

export const students = pgTable("students", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  color: text().notNull(),
  gradeLevel: text("grade_level"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const subjects = pgTable(
  "subjects",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("subjects_student_id_idx").on(table.studentId)],
);

export const resources = pgTable(
  "resources",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("resources_subject_id_idx").on(table.subjectId)],
);

export const sharedCurricula = pgTable("shared_curricula", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  description: text(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const sharedCurriculumStudents = pgTable(
  "shared_curriculum_students",
  {
    id: uuid().primaryKey().defaultRandom(),
    sharedCurriculumId: uuid("shared_curriculum_id")
      .notNull()
      .references(() => sharedCurricula.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("shared_curriculum_students_shared_curriculum_id_idx").on(
      table.sharedCurriculumId,
    ),
    index("shared_curriculum_students_student_id_idx").on(table.studentId),
    uniqueIndex("shared_curriculum_students_unique_idx").on(
      table.sharedCurriculumId,
      table.studentId,
    ),
  ],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid().primaryKey().defaultRandom(),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    lessonNumber: integer("lesson_number").notNull(),
    title: text(),
    status: lessonStatusEnum().notNull().default("planned"),
    scheduledDate: date("scheduled_date"),
    completionDate: date("completion_date"),
    plan: text(),
    notes: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("lessons_resource_id_idx").on(table.resourceId),
    index("lessons_scheduled_date_idx").on(table.scheduledDate),
    index("lessons_scheduled_date_status_idx").on(
      table.scheduledDate,
      table.status,
    ),
  ],
);

export const sharedLessons = pgTable(
  "shared_lessons",
  {
    id: uuid().primaryKey().defaultRandom(),
    sharedCurriculumId: uuid("shared_curriculum_id")
      .notNull()
      .references(() => sharedCurricula.id, { onDelete: "cascade" }),
    lessonNumber: integer("lesson_number").notNull(),
    title: text(),
    status: lessonStatusEnum().notNull().default("planned"),
    scheduledDate: date("scheduled_date"),
    completionDate: date("completion_date"),
    plan: text(),
    notes: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("shared_lessons_shared_curriculum_id_idx").on(
      table.sharedCurriculumId,
    ),
    index("shared_lessons_scheduled_date_idx").on(table.scheduledDate),
    index("shared_lessons_scheduled_date_status_idx").on(
      table.scheduledDate,
      table.status,
    ),
  ],
);

export const dailyNotes = pgTable(
  "daily_notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    date: date().notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("daily_notes_student_id_date_idx").on(table.studentId, table.date),
  ],
);

export const absenceReasons = pgTable("absence_reasons", {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull(),
  color: text().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const absences = pgTable(
  "absences",
  {
    id: uuid().primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    date: date().notNull(),
    reasonId: uuid("reason_id")
      .notNull()
      .references(() => absenceReasons.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("absences_student_date_idx").on(table.studentId, table.date),
    index("absences_date_idx").on(table.date),
  ],
);

export const globalAbsences = pgTable(
  "global_absences",
  {
    id: uuid().primaryKey().defaultRandom(),
    date: date().notNull(),
    reasonId: uuid("reason_id")
      .notNull()
      .references(() => absenceReasons.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("global_absences_date_unique_idx").on(table.date),
    index("global_absences_date_idx").on(table.date),
  ],
);

export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const studentsRelations = relations(students, ({ many }) => ({
  subjects: many(subjects),
  dailyNotes: many(dailyNotes),
  absences: many(absences),
  sharedCurriculumMemberships: many(sharedCurriculumStudents),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  student: one(students, {
    fields: [subjects.studentId],
    references: [students.id],
  }),
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [resources.subjectId],
    references: [subjects.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  resource: one(resources, {
    fields: [lessons.resourceId],
    references: [resources.id],
  }),
}));

export const sharedCurriculaRelations = relations(
  sharedCurricula,
  ({ many }) => ({
    students: many(sharedCurriculumStudents),
    lessons: many(sharedLessons),
  }),
);

export const sharedCurriculumStudentsRelations = relations(
  sharedCurriculumStudents,
  ({ one }) => ({
    sharedCurriculum: one(sharedCurricula, {
      fields: [sharedCurriculumStudents.sharedCurriculumId],
      references: [sharedCurricula.id],
    }),
    student: one(students, {
      fields: [sharedCurriculumStudents.studentId],
      references: [students.id],
    }),
  }),
);

export const sharedLessonsRelations = relations(sharedLessons, ({ one }) => ({
  sharedCurriculum: one(sharedCurricula, {
    fields: [sharedLessons.sharedCurriculumId],
    references: [sharedCurricula.id],
  }),
}));

export const dailyNotesRelations = relations(dailyNotes, ({ one }) => ({
  student: one(students, {
    fields: [dailyNotes.studentId],
    references: [students.id],
  }),
}));

export const absenceReasonsRelations = relations(
  absenceReasons,
  ({ many }) => ({
    absences: many(absences),
    globalAbsences: many(globalAbsences),
  }),
);

export const absencesRelations = relations(absences, ({ one }) => ({
  student: one(students, {
    fields: [absences.studentId],
    references: [students.id],
  }),
  reason: one(absenceReasons, {
    fields: [absences.reasonId],
    references: [absenceReasons.id],
  }),
}));

export const globalAbsencesRelations = relations(globalAbsences, ({ one }) => ({
  reason: one(absenceReasons, {
    fields: [globalAbsences.reasonId],
    references: [absenceReasons.id],
  }),
}));

// ── Inferred Types ─────────────────────────────────────────────────────────

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

export type SharedCurriculum = typeof sharedCurricula.$inferSelect;
export type NewSharedCurriculum = typeof sharedCurricula.$inferInsert;

export type SharedCurriculumStudent =
  typeof sharedCurriculumStudents.$inferSelect;
export type NewSharedCurriculumStudent =
  typeof sharedCurriculumStudents.$inferInsert;

export type SharedLesson = typeof sharedLessons.$inferSelect;
export type NewSharedLesson = typeof sharedLessons.$inferInsert;

export type DailyNote = typeof dailyNotes.$inferSelect;
export type NewDailyNote = typeof dailyNotes.$inferInsert;

export type AbsenceReason = typeof absenceReasons.$inferSelect;
export type NewAbsenceReason = typeof absenceReasons.$inferInsert;

export type Absence = typeof absences.$inferSelect;
export type NewAbsence = typeof absences.$inferInsert;

export type GlobalAbsence = typeof globalAbsences.$inferSelect;
export type NewGlobalAbsence = typeof globalAbsences.$inferInsert;

export type AppSetting = typeof appSettings.$inferSelect;
