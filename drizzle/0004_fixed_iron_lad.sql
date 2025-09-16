ALTER TABLE "lecturers" RENAME COLUMN "id" TO "code";--> statement-breakpoint
ALTER TABLE "schedules" RENAME COLUMN "lecturer_id" TO "lecturer_code";--> statement-breakpoint
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_lecturer_id_lecturers_id_fk";
--> statement-breakpoint
ALTER TABLE "schedules" ALTER COLUMN "schedule_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "class_year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_lecturer_code_lecturers_code_fk" FOREIGN KEY ("lecturer_code") REFERENCES "public"."lecturers"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_class_year_range" CHECK ("schedules"."class_year" >= 1000 AND "schedules"."class_year" <= 9999);