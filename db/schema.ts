import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
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

export const appSettings = pgTable("app_settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});

// ── Relations ──────────────────────────────────────────────────────────────

export const studentsRelations = relations(students, ({ many }) => ({
  subjects: many(subjects),
  dailyNotes: many(dailyNotes),
  absences: many(absences),
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

// ── Inferred Types ─────────────────────────────────────────────────────────

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

export type DailyNote = typeof dailyNotes.$inferSelect;
export type NewDailyNote = typeof dailyNotes.$inferInsert;

export type AbsenceReason = typeof absenceReasons.$inferSelect;
export type NewAbsenceReason = typeof absenceReasons.$inferInsert;

export type Absence = typeof absences.$inferSelect;
export type NewAbsence = typeof absences.$inferInsert;

export type AppSetting = typeof appSettings.$inferSelect;
