CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text DEFAULT '' NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
