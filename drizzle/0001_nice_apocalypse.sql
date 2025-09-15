ALTER TABLE "subjects" ADD COLUMN "paid_credit" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "academic_credit" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_paid_credit_range" CHECK ("subjects"."paid_credit" >= 1 AND "subjects"."paid_credit" <= 4);--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_academic_credit_range" CHECK ("subjects"."academic_credit" >= 1 AND "subjects"."academic_credit" <= 4);