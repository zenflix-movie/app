DELETE FROM "zenflix_review";--> statement-breakpoint
ALTER TABLE "zenflix_review" DROP CONSTRAINT "review_video_user_unique";--> statement-breakpoint
ALTER TABLE "zenflix_review" DROP CONSTRAINT "zenflix_review_userId_zenflix_user_id_fk";
--> statement-breakpoint
ALTER TABLE "zenflix_review" ADD COLUMN "profileId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "zenflix_review" ADD CONSTRAINT "zenflix_review_profileId_zenflix_profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."zenflix_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zenflix_review" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "zenflix_review" ADD CONSTRAINT "review_video_profile_unique" UNIQUE("videoId","profileId");