-- Participants are identified by a whole name rather than a split pair, and the
-- optional org/course code is gone from the form, so its column goes too.
--
-- Written by hand rather than generated, because a generated diff would drop
-- the old columns and add the new ones with nothing in between — the backfill
-- is the point. Joining on a single space is exactly how the two fields were
-- rendered together everywhere they appeared.

ALTER TABLE "participants" ADD COLUMN "full_name" varchar(240);--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "normalized_full_name" varchar(240);--> statement-breakpoint

UPDATE "participants"
SET "full_name" = btrim("first_name" || ' ' || "last_name"),
    "normalized_full_name" = btrim("normalized_first_name" || ' ' || "normalized_last_name");--> statement-breakpoint

ALTER TABLE "participants" ALTER COLUMN "full_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "normalized_full_name" SET NOT NULL;--> statement-breakpoint

DROP INDEX IF EXISTS "uq_participants_identity";--> statement-breakpoint
DROP INDEX IF EXISTS "ix_participants_normalized_name";--> statement-breakpoint

ALTER TABLE "participants" DROP COLUMN "first_name";--> statement-breakpoint
ALTER TABLE "participants" DROP COLUMN "last_name";--> statement-breakpoint
ALTER TABLE "participants" DROP COLUMN "normalized_first_name";--> statement-breakpoint
ALTER TABLE "participants" DROP COLUMN "normalized_last_name";--> statement-breakpoint

CREATE UNIQUE INDEX "uq_participants_identity" ON "participants" USING btree ("normalized_mobile","normalized_full_name");--> statement-breakpoint
CREATE INDEX "ix_participants_normalized_name" ON "participants" USING btree ("normalized_full_name");--> statement-breakpoint

DROP INDEX IF EXISTS "ix_test_attempts_org_code";--> statement-breakpoint
ALTER TABLE "test_attempts" DROP COLUMN "org_code";
