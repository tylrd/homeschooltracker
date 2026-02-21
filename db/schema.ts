import { relations } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
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

export const lessonMoodEnum = pgEnum("lesson_mood", [
  "loved_it",
  "tears",
  "meltdown",
  "pulling_teeth",
]);

export const schoolDocumentTypeEnum = pgEnum("school_document_type", [
  "weekly_plan",
  "curriculum_outline",
  "pacing_calendar",
]);

export const BOOTSTRAP_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000001";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// ── Tables ─────────────────────────────────────────────────────────────────

export const users = pgTable(
  "user",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("user_email_unique_idx").on(table.email)],
);

export const organizations = pgTable(
  "organization",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull(),
    logo: text(),
    metadata: jsonb(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("organization_slug_unique_idx").on(table.slug)],
);

export const sessions = pgTable(
  "session",
  {
    id: uuid().primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activeOrganizationId: uuid("active_organization_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    uniqueIndex("session_token_unique_idx").on(table.token),
    index("session_user_id_idx").on(table.userId),
    index("session_active_organization_id_idx").on(table.activeOrganizationId),
  ],
);

export const accounts = pgTable(
  "account",
  {
    id: uuid().primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("account_provider_account_unique_idx").on(
      table.providerId,
      table.accountId,
    ),
    index("account_user_id_idx").on(table.userId),
  ],
);

export const verifications = pgTable(
  "verification",
  {
    id: uuid().primaryKey().defaultRandom(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const members = pgTable(
  "member",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text().notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("member_organization_user_unique_idx").on(
      table.organizationId,
      table.userId,
    ),
    index("member_organization_id_idx").on(table.organizationId),
    index("member_user_id_idx").on(table.userId),
  ],
);

export const invitations = pgTable(
  "invitation",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text().notNull(),
    role: text(),
    status: text().notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    inviterId: uuid("inviter_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("invitation_organization_id_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
    uniqueIndex("invitation_organization_email_unique_idx").on(
      table.organizationId,
      table.email,
    ),
  ],
);

export const teams = pgTable(
  "team",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("team_organization_id_idx").on(table.organizationId),
    uniqueIndex("team_organization_name_unique_idx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

export const teamMembers = pgTable(
  "team_member",
  {
    id: uuid().primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("team_member_team_id_idx").on(table.teamId),
    index("team_member_user_id_idx").on(table.userId),
    uniqueIndex("team_member_team_user_unique_idx").on(
      table.teamId,
      table.userId,
    ),
  ],
);

export const userDefaultOrganizations = pgTable(
  "user_default_organizations",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("user_default_organizations_organization_id_idx").on(
      table.organizationId,
    ),
  ],
);

export const students = pgTable(
  "students",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
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
  },
  (table) => [index("students_organization_id_idx").on(table.organizationId)],
);

export const subjects = pgTable(
  "subjects",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
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
  (table) => [
    index("subjects_organization_id_idx").on(table.organizationId),
    index("subjects_student_id_idx").on(table.studentId),
  ],
);

export const curriculumImages = pgTable(
  "curriculum_images",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text().notNull().default("postgres"),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    width: integer(),
    height: integer(),
    imageData: bytea("image_data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("curriculum_images_organization_id_idx").on(table.organizationId),
  ],
);

export const resources = pgTable(
  "resources",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    coverImageId: uuid("cover_image_id").references(() => curriculumImages.id, {
      onDelete: "set null",
    }),
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
  (table) => [
    index("resources_organization_id_idx").on(table.organizationId),
    index("resources_subject_id_idx").on(table.subjectId),
    index("resources_cover_image_id_idx").on(table.coverImageId),
  ],
);

export const sharedCurricula = pgTable(
  "shared_curricula",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    coverImageId: uuid("cover_image_id").references(() => curriculumImages.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("shared_curricula_organization_id_idx").on(table.organizationId),
    index("shared_curricula_cover_image_id_idx").on(table.coverImageId),
  ],
);

export const sharedCurriculumStudents = pgTable(
  "shared_curriculum_students",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
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
    index("shared_curriculum_students_organization_id_idx").on(
      table.organizationId,
    ),
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
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    lessonNumber: integer("lesson_number").notNull(),
    title: text(),
    status: lessonStatusEnum().notNull().default("planned"),
    scheduledDate: date("scheduled_date"),
    completionDate: date("completion_date"),
    mood: lessonMoodEnum("mood"),
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
    index("lessons_organization_id_idx").on(table.organizationId),
    index("lessons_organization_scheduled_date_status_idx").on(
      table.organizationId,
      table.scheduledDate,
      table.status,
    ),
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
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sharedCurriculumId: uuid("shared_curriculum_id")
      .notNull()
      .references(() => sharedCurricula.id, { onDelete: "cascade" }),
    lessonNumber: integer("lesson_number").notNull(),
    title: text(),
    status: lessonStatusEnum().notNull().default("planned"),
    scheduledDate: date("scheduled_date"),
    completionDate: date("completion_date"),
    mood: lessonMoodEnum("mood"),
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
    index("shared_lessons_organization_id_idx").on(table.organizationId),
    index("shared_lessons_organization_scheduled_date_status_idx").on(
      table.organizationId,
      table.scheduledDate,
      table.status,
    ),
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

export const lessonWorkSamples = pgTable(
  "lesson_work_samples",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => curriculumImages.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lesson_work_samples_organization_id_idx").on(table.organizationId),
    index("lesson_work_samples_lesson_id_idx").on(table.lessonId),
    index("lesson_work_samples_image_id_idx").on(table.imageId),
  ],
);

export const sharedLessonWorkSamples = pgTable(
  "shared_lesson_work_samples",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sharedLessonId: uuid("shared_lesson_id")
      .notNull()
      .references(() => sharedLessons.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => curriculumImages.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("shared_lesson_work_samples_organization_id_idx").on(
      table.organizationId,
    ),
    index("shared_lesson_work_samples_shared_lesson_id_idx").on(
      table.sharedLessonId,
    ),
    index("shared_lesson_work_samples_image_id_idx").on(table.imageId),
  ],
);

export const schoolDocuments = pgTable(
  "school_documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: schoolDocumentTypeEnum("type").notNull(),
    title: text().notNull(),
    notes: text(),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "set null",
    }),
    weekStartDate: date("week_start_date"),
    weekEndDate: date("week_end_date"),
    schoolYearLabel: text("school_year_label"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("school_documents_organization_id_idx").on(table.organizationId),
    index("school_documents_resource_id_idx").on(table.resourceId),
    index("school_documents_type_idx").on(table.type),
    index("school_documents_week_start_date_idx").on(table.weekStartDate),
  ],
);

export const schoolDocumentFiles = pgTable(
  "school_document_files",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    schoolDocumentId: uuid("school_document_id")
      .notNull()
      .references(() => schoolDocuments.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => curriculumImages.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    rotationDegrees: integer("rotation_degrees").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("school_document_files_organization_id_idx").on(table.organizationId),
    index("school_document_files_school_document_id_idx").on(
      table.schoolDocumentId,
    ),
    index("school_document_files_image_id_idx").on(table.imageId),
    uniqueIndex("school_document_files_doc_sort_unique_idx").on(
      table.schoolDocumentId,
      table.sortOrder,
    ),
  ],
);

export const schoolDocumentStudents = pgTable(
  "school_document_students",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    schoolDocumentId: uuid("school_document_id")
      .notNull()
      .references(() => schoolDocuments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("school_document_students_organization_id_idx").on(
      table.organizationId,
    ),
    index("school_document_students_school_document_id_idx").on(
      table.schoolDocumentId,
    ),
    index("school_document_students_student_id_idx").on(table.studentId),
    uniqueIndex("school_document_students_unique_idx").on(
      table.schoolDocumentId,
      table.studentId,
    ),
  ],
);

export const dailyNotes = pgTable(
  "daily_notes",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
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
    index("daily_notes_organization_id_idx").on(table.organizationId),
    index("daily_notes_organization_student_id_date_idx").on(
      table.organizationId,
      table.studentId,
      table.date,
    ),
    index("daily_notes_student_id_date_idx").on(table.studentId, table.date),
  ],
);

export const absenceReasons = pgTable(
  "absence_reasons",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    color: text().notNull(),
    countsAsPresent: boolean("counts_as_present").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("absence_reasons_organization_id_idx").on(table.organizationId),
  ],
);

export const absences = pgTable(
  "absences",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
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
    index("absences_organization_id_idx").on(table.organizationId),
    index("absences_organization_student_date_idx").on(
      table.organizationId,
      table.studentId,
      table.date,
    ),
    index("absences_student_date_idx").on(table.studentId, table.date),
    index("absences_date_idx").on(table.date),
  ],
);

export const globalAbsences = pgTable(
  "global_absences",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    date: date().notNull(),
    reasonId: uuid("reason_id")
      .notNull()
      .references(() => absenceReasons.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("global_absences_organization_date_unique_idx").on(
      table.organizationId,
      table.date,
    ),
    index("global_absences_organization_id_idx").on(table.organizationId),
    index("global_absences_organization_date_idx").on(
      table.organizationId,
      table.date,
    ),
    index("global_absences_date_idx").on(table.date),
  ],
);

export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid().primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    key: text().notNull(),
    value: text().notNull(),
  },
  (table) => [
    index("app_settings_organization_id_idx").on(table.organizationId),
    uniqueIndex("app_settings_organization_key_unique_idx").on(
      table.organizationId,
      table.key,
    ),
  ],
);

// ── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  memberships: many(members),
  invitationsSent: many(invitations),
  teamMemberships: many(teamMembers),
  defaultOrganizations: many(userDefaultOrganizations),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  sessions: many(sessions),
  members: many(members),
  invitations: many(invitations),
  teams: many(teams),
  userDefaults: many(userDefaultOrganizations),
  students: many(students),
  subjects: many(subjects),
  resources: many(resources),
  sharedCurricula: many(sharedCurricula),
  sharedCurriculumStudents: many(sharedCurriculumStudents),
  lessons: many(lessons),
  sharedLessons: many(sharedLessons),
  lessonWorkSamples: many(lessonWorkSamples),
  sharedLessonWorkSamples: many(sharedLessonWorkSamples),
  schoolDocuments: many(schoolDocuments),
  schoolDocumentFiles: many(schoolDocumentFiles),
  schoolDocumentStudents: many(schoolDocumentStudents),
  dailyNotes: many(dailyNotes),
  absenceReasons: many(absenceReasons),
  absences: many(absences),
  globalAbsences: many(globalAbsences),
  appSettings: many(appSettings),
  curriculumImages: many(curriculumImages),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  activeOrganization: one(organizations, {
    fields: [sessions.activeOrganizationId],
    references: [organizations.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const membersRelations = relations(members, ({ one }) => ({
  organization: one(organizations, {
    fields: [members.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [teams.organizationId],
    references: [organizations.id],
  }),
  members: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const userDefaultOrganizationsRelations = relations(
  userDefaultOrganizations,
  ({ one }) => ({
    user: one(users, {
      fields: [userDefaultOrganizations.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [userDefaultOrganizations.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const studentsRelations = relations(students, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [students.organizationId],
    references: [organizations.id],
  }),
  subjects: many(subjects),
  dailyNotes: many(dailyNotes),
  absences: many(absences),
  sharedCurriculumMemberships: many(sharedCurriculumStudents),
  schoolDocumentMemberships: many(schoolDocumentStudents),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [subjects.organizationId],
    references: [organizations.id],
  }),
  student: one(students, {
    fields: [subjects.studentId],
    references: [students.id],
  }),
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [resources.organizationId],
    references: [organizations.id],
  }),
  subject: one(subjects, {
    fields: [resources.subjectId],
    references: [subjects.id],
  }),
  coverImage: one(curriculumImages, {
    fields: [resources.coverImageId],
    references: [curriculumImages.id],
  }),
  lessons: many(lessons),
  schoolDocuments: many(schoolDocuments),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [lessons.organizationId],
    references: [organizations.id],
  }),
  resource: one(resources, {
    fields: [lessons.resourceId],
    references: [resources.id],
  }),
  workSamples: many(lessonWorkSamples),
}));

export const sharedCurriculaRelations = relations(
  sharedCurricula,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [sharedCurricula.organizationId],
      references: [organizations.id],
    }),
    coverImage: one(curriculumImages, {
      fields: [sharedCurricula.coverImageId],
      references: [curriculumImages.id],
    }),
    students: many(sharedCurriculumStudents),
    lessons: many(sharedLessons),
  }),
);

export const curriculumImagesRelations = relations(
  curriculumImages,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [curriculumImages.organizationId],
      references: [organizations.id],
    }),
    resources: many(resources),
    sharedCurricula: many(sharedCurricula),
    lessonWorkSamples: many(lessonWorkSamples),
    sharedLessonWorkSamples: many(sharedLessonWorkSamples),
    schoolDocumentFiles: many(schoolDocumentFiles),
  }),
);

export const schoolDocumentsRelations = relations(
  schoolDocuments,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [schoolDocuments.organizationId],
      references: [organizations.id],
    }),
    resource: one(resources, {
      fields: [schoolDocuments.resourceId],
      references: [resources.id],
    }),
    files: many(schoolDocumentFiles),
    students: many(schoolDocumentStudents),
  }),
);

export const schoolDocumentFilesRelations = relations(
  schoolDocumentFiles,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [schoolDocumentFiles.organizationId],
      references: [organizations.id],
    }),
    schoolDocument: one(schoolDocuments, {
      fields: [schoolDocumentFiles.schoolDocumentId],
      references: [schoolDocuments.id],
    }),
    image: one(curriculumImages, {
      fields: [schoolDocumentFiles.imageId],
      references: [curriculumImages.id],
    }),
  }),
);

export const schoolDocumentStudentsRelations = relations(
  schoolDocumentStudents,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [schoolDocumentStudents.organizationId],
      references: [organizations.id],
    }),
    schoolDocument: one(schoolDocuments, {
      fields: [schoolDocumentStudents.schoolDocumentId],
      references: [schoolDocuments.id],
    }),
    student: one(students, {
      fields: [schoolDocumentStudents.studentId],
      references: [students.id],
    }),
  }),
);

export const sharedCurriculumStudentsRelations = relations(
  sharedCurriculumStudents,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [sharedCurriculumStudents.organizationId],
      references: [organizations.id],
    }),
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

export const sharedLessonsRelations = relations(
  sharedLessons,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [sharedLessons.organizationId],
      references: [organizations.id],
    }),
    sharedCurriculum: one(sharedCurricula, {
      fields: [sharedLessons.sharedCurriculumId],
      references: [sharedCurricula.id],
    }),
    workSamples: many(sharedLessonWorkSamples),
  }),
);

export const lessonWorkSamplesRelations = relations(
  lessonWorkSamples,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [lessonWorkSamples.organizationId],
      references: [organizations.id],
    }),
    lesson: one(lessons, {
      fields: [lessonWorkSamples.lessonId],
      references: [lessons.id],
    }),
    image: one(curriculumImages, {
      fields: [lessonWorkSamples.imageId],
      references: [curriculumImages.id],
    }),
  }),
);

export const sharedLessonWorkSamplesRelations = relations(
  sharedLessonWorkSamples,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [sharedLessonWorkSamples.organizationId],
      references: [organizations.id],
    }),
    sharedLesson: one(sharedLessons, {
      fields: [sharedLessonWorkSamples.sharedLessonId],
      references: [sharedLessons.id],
    }),
    image: one(curriculumImages, {
      fields: [sharedLessonWorkSamples.imageId],
      references: [curriculumImages.id],
    }),
  }),
);

export const dailyNotesRelations = relations(dailyNotes, ({ one }) => ({
  organization: one(organizations, {
    fields: [dailyNotes.organizationId],
    references: [organizations.id],
  }),
  student: one(students, {
    fields: [dailyNotes.studentId],
    references: [students.id],
  }),
}));

export const absenceReasonsRelations = relations(
  absenceReasons,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [absenceReasons.organizationId],
      references: [organizations.id],
    }),
    absences: many(absences),
    globalAbsences: many(globalAbsences),
  }),
);

export const absencesRelations = relations(absences, ({ one }) => ({
  organization: one(organizations, {
    fields: [absences.organizationId],
    references: [organizations.id],
  }),
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
  organization: one(organizations, {
    fields: [globalAbsences.organizationId],
    references: [organizations.id],
  }),
  reason: one(absenceReasons, {
    fields: [globalAbsences.reasonId],
    references: [absenceReasons.id],
  }),
}));

export const appSettingsRelations = relations(appSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [appSettings.organizationId],
    references: [organizations.id],
  }),
}));

// ── Inferred Types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type UserDefaultOrganization =
  typeof userDefaultOrganizations.$inferSelect;
export type NewUserDefaultOrganization =
  typeof userDefaultOrganizations.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type CurriculumImage = typeof curriculumImages.$inferSelect;
export type NewCurriculumImage = typeof curriculumImages.$inferInsert;

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

export type LessonWorkSample = typeof lessonWorkSamples.$inferSelect;
export type NewLessonWorkSample = typeof lessonWorkSamples.$inferInsert;

export type SharedLessonWorkSample =
  typeof sharedLessonWorkSamples.$inferSelect;
export type NewSharedLessonWorkSample =
  typeof sharedLessonWorkSamples.$inferInsert;

export type SchoolDocument = typeof schoolDocuments.$inferSelect;
export type NewSchoolDocument = typeof schoolDocuments.$inferInsert;

export type SchoolDocumentFile = typeof schoolDocumentFiles.$inferSelect;
export type NewSchoolDocumentFile = typeof schoolDocumentFiles.$inferInsert;

export type SchoolDocumentStudent = typeof schoolDocumentStudents.$inferSelect;
export type NewSchoolDocumentStudent =
  typeof schoolDocumentStudents.$inferInsert;

export type DailyNote = typeof dailyNotes.$inferSelect;
export type NewDailyNote = typeof dailyNotes.$inferInsert;

export type AbsenceReason = typeof absenceReasons.$inferSelect;
export type NewAbsenceReason = typeof absenceReasons.$inferInsert;

export type Absence = typeof absences.$inferSelect;
export type NewAbsence = typeof absences.$inferInsert;

export type GlobalAbsence = typeof globalAbsences.$inferSelect;
export type NewGlobalAbsence = typeof globalAbsences.$inferInsert;

export type AppSetting = typeof appSettings.$inferSelect;
