alter table "public"."agents" add column "production_version_id" text;

alter table "public"."agents" add column "staging_version_id" text;

CREATE INDEX agents_production_version_idx ON public.agents USING btree (production_version_id) WHERE (production_version_id IS NOT NULL);

CREATE INDEX agents_staging_version_idx ON public.agents USING btree (staging_version_id) WHERE (staging_version_id IS NOT NULL);

alter table "public"."agents" add constraint "agents_production_version_id_fkey" FOREIGN KEY (production_version_id) REFERENCES public.versions(id) not valid;

alter table "public"."agents" validate constraint "agents_production_version_id_fkey";

alter table "public"."agents" add constraint "agents_staging_version_id_fkey" FOREIGN KEY (staging_version_id) REFERENCES public.versions(id) not valid;

alter table "public"."agents" validate constraint "agents_staging_version_id_fkey";


