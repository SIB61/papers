ALTER TABLE "users" ADD COLUMN "username" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "users"
SET "username" = trim(both '-' from regexp_replace(lower(split_part("email", '@', 1)), '[^a-z0-9]+', '-', 'g'))
WHERE "username" IS NULL OR "username" = '';--> statement-breakpoint
UPDATE "posts"
SET "user_id" = (SELECT "id" FROM "users" ORDER BY "id" LIMIT 1)
WHERE "user_id" IS NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_slug_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "posts_user_slug_idx" ON "posts" USING btree ("user_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");