import {
  pgTable,
  serial,
  varchar,
  integer,
  time,
  pgEnum,
  unique,
  timestamp,
  check,
  date
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

export const termEnum = pgEnum('term', ['S1', 'S2', 'S3'])
export const dayEnum = pgEnum('day_of_week', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])

export const semesters = pgTable(
  'semesters',
  {
    id: serial('id').primaryKey(),
    academicYear: varchar('academic_year', { length: 16 }).notNull(),
    term: termEnum('term').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => ({
    uniqYearTerm: unique().on(t.academicYear, t.term)
  })
)

export const lecturers = pgTable(
  'lecturers',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 128 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => ({
    uniqName: unique().on(t.name)
  })
)

export const subjects = pgTable(
  'subjects',
  {
    id: serial('id').primaryKey(),
    code: varchar('code', { length: 32 }).notNull(),
    name: varchar('name', { length: 256 }).notNull(),
    paidCredit: integer('paid_credit').notNull().default(1),
    academicCredit: integer('academic_credit').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => ({
    uniqCode: unique().on(t.code),
    paidCreditRange: check('subjects_paid_credit_range', sql`${t.paidCredit} >= 1 AND ${t.paidCredit} <= 4`),
    academicCreditRange: check('subjects_academic_credit_range', sql`${t.academicCredit} >= 1 AND ${t.academicCredit} <= 4`)
  })
)

export const rooms = pgTable(
  'rooms',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 64 }).notNull(),
    capacity: integer('capacity').notNull(),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull()
  },
  (t) => ({
    uniqName: unique().on(t.name)
  })
)

export const schedules = pgTable(
  'schedules',
  {
    id: serial('id').primaryKey(),
    semesterId: integer('semester_id').references(() => semesters.id).notNull(),
    subjectId: integer('subject_id').references(() => subjects.id).notNull(),
    lecturerId: integer('lecturer_id').references(() => lecturers.id).notNull(),
    roomId: integer('room_id').references(() => rooms.id).notNull(),
    scheduleDate: date('schedule_date'),
    day: dayEnum('day').notNull(),
    startTime: time('start_time', { withTimezone: false }).notNull(),
    endTime: time('end_time', { withTimezone: false }).notNull(),
    capacityOverride: integer('capacity_override'),
    createdAt: timestamp('created_at', { withTimezone: false }).defaultNow().notNull()
  }
)

export const semestersRelations = relations(semesters, ({ many }) => ({
  schedules: many(schedules)
}))

export const lecturersRelations = relations(lecturers, ({ many }) => ({
  schedules: many(schedules)
}))

export const subjectsRelations = relations(subjects, ({ many }) => ({
  schedules: many(schedules)
}))

export const roomsRelations = relations(rooms, ({ many }) => ({
  schedules: many(schedules)
}))
