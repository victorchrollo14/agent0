


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."workspace_user_role" AS ENUM (
    'admin',
    'writer',
    'reader'
);


ALTER TYPE "public"."workspace_user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;  
  return new;
end;
$$;


ALTER FUNCTION "public"."insert_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_admin"("p_workspace_id" "text", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_user wu
    WHERE wu.workspace_id = p_workspace_id
      AND wu.user_id = p_user_id
      AND wu.role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_workspace_admin"("p_workspace_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_reader"("p_workspace_id" "text", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_user wu
    WHERE wu.workspace_id = p_workspace_id
      AND wu.user_id = p_user_id
  );
$$;


ALTER FUNCTION "public"."is_workspace_reader"("p_workspace_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_writer"("p_workspace_id" "text", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_user wu
    WHERE wu.workspace_id = p_workspace_id
      AND wu.user_id = p_user_id
      AND wu.role IN ('writer', 'admin')
  );
$$;


ALTER FUNCTION "public"."is_workspace_writer"("p_workspace_id" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."workspace_assign_owner_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- avoid duplicates: insert only if no existing mapping for this workspace and user
  INSERT INTO public.workspace_user (workspace_id, user_id, role)
  SELECT NEW.id, NEW.user_id, 'admin'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.workspace_user
    WHERE workspace_id = NEW.id
      AND user_id = NEW.user_id
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."workspace_assign_owner_admin"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "text" NOT NULL,
    "workspace_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "key" "text" NOT NULL
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mcps" (
    "id" "text" NOT NULL,
    "workspace_id" "text" NOT NULL,
    "encrypted_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."mcps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."providers" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "workspace_id" "text" NOT NULL,
    "encrypted_data" "text" NOT NULL
);


ALTER TABLE "public"."providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."runs" (
    "id" "text" NOT NULL,
    "workspace_id" "text" NOT NULL,
    "version_id" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_error" boolean DEFAULT false NOT NULL,
    "is_test" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."versions" (
    "id" "text" NOT NULL,
    "agent_id" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "is_deployed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL
);


ALTER TABLE "public"."versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_user" (
    "user_id" "uuid" NOT NULL,
    "workspace_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "public"."workspace_user_role" DEFAULT 'reader'::"public"."workspace_user_role" NOT NULL
);


ALTER TABLE "public"."workspace_user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mcps"
    ADD CONSTRAINT "mcps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."runs"
    ADD CONSTRAINT "runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."versions"
    ADD CONSTRAINT "versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspace_user"
    ADD CONSTRAINT "workspace_user_pkey" PRIMARY KEY ("user_id", "workspace_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "workspace_assign_owner_admin" AFTER INSERT ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."workspace_assign_owner_admin"();



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mcps"
    ADD CONSTRAINT "mcps_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."runs"
    ADD CONSTRAINT "runs_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "public"."versions"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."runs"
    ADD CONSTRAINT "runs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."versions"
    ADD CONSTRAINT "versions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."versions"
    ADD CONSTRAINT "versions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."workspace_user"
    ADD CONSTRAINT "workspace_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_user"
    ADD CONSTRAINT "workspace_user_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "ALL" ON "public"."api_keys" TO "authenticated" USING ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "DELETE" ON "public"."agents" FOR DELETE TO "authenticated" USING ("public"."is_workspace_writer"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "DELETE" ON "public"."mcps" FOR DELETE TO "authenticated" USING ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "DELETE" ON "public"."providers" FOR DELETE TO "authenticated" USING ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "DELETE" ON "public"."workspace_user" FOR DELETE TO "authenticated" USING (("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "DELETE" ON "public"."workspaces" FOR DELETE TO "authenticated" USING (("public"."is_workspace_admin"("id", ( SELECT "auth"."uid"() AS "uid")) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "INSERT" ON "public"."agents" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_workspace_writer"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "INSERT" ON "public"."mcps" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "INSERT" ON "public"."providers" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "INSERT" ON "public"."versions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_workspace_writer"(( SELECT "a"."workspace_id"
   FROM "public"."agents" "a"
  WHERE ("a"."id" = "versions"."agent_id")), ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "INSERT" ON "public"."workspace_user" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "INSERT" ON "public"."workspaces" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") IS NOT NULL) AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "SELECT" ON "public"."agents" FOR SELECT TO "authenticated" USING ("public"."is_workspace_reader"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "SELECT" ON "public"."mcps" FOR SELECT TO "authenticated" USING ("public"."is_workspace_reader"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "SELECT" ON "public"."providers" FOR SELECT TO "authenticated" USING ("public"."is_workspace_reader"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "SELECT" ON "public"."runs" FOR SELECT TO "authenticated" USING ("public"."is_workspace_reader"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "SELECT" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "SELECT" ON "public"."versions" FOR SELECT TO "authenticated" USING ("public"."is_workspace_reader"(( SELECT "a"."workspace_id"
   FROM "public"."agents" "a"
  WHERE ("a"."id" = "versions"."agent_id")), ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "SELECT" ON "public"."workspace_user" FOR SELECT TO "authenticated" USING (("public"."is_workspace_reader"("workspace_id", ( SELECT "auth"."uid"() AS "uid")) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "SELECT" ON "public"."workspaces" FOR SELECT TO "authenticated" USING (("public"."is_workspace_reader"("id", ( SELECT "auth"."uid"() AS "uid")) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "UPDATE" ON "public"."agents" FOR UPDATE TO "authenticated" USING ("public"."is_workspace_writer"("workspace_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_workspace_writer"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "UPDATE" ON "public"."mcps" FOR UPDATE TO "authenticated" USING ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "UPDATE" ON "public"."providers" FOR UPDATE TO "authenticated" USING ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "UPDATE" ON "public"."users" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "UPDATE" ON "public"."versions" FOR UPDATE TO "authenticated" USING ("public"."is_workspace_writer"(( SELECT "a"."workspace_id"
   FROM "public"."agents" "a"
  WHERE ("a"."id" = "versions"."agent_id")), ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK ("public"."is_workspace_writer"(( SELECT "a"."workspace_id"
   FROM "public"."agents" "a"
  WHERE ("a"."id" = "versions"."agent_id")), ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "UPDATE" ON "public"."workspace_user" FOR UPDATE TO "authenticated" USING (("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")) OR ("auth"."uid"() = "user_id"))) WITH CHECK (("public"."is_workspace_admin"("workspace_id", ( SELECT "auth"."uid"() AS "uid")) OR ("auth"."uid"() = "user_id")));



CREATE POLICY "UPDATE" ON "public"."workspaces" FOR UPDATE TO "authenticated" USING (("public"."is_workspace_admin"("id", ( SELECT "auth"."uid"() AS "uid")) OR ("auth"."uid"() = "user_id")));



ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mcps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."versions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspace_user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."insert_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_admin"("p_workspace_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_admin"("p_workspace_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_admin"("p_workspace_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_reader"("p_workspace_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_reader"("p_workspace_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_reader"("p_workspace_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_writer"("p_workspace_id" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_writer"("p_workspace_id" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_writer"("p_workspace_id" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."workspace_assign_owner_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."workspace_assign_owner_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."workspace_assign_owner_admin"() TO "service_role";


















GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."mcps" TO "anon";
GRANT ALL ON TABLE "public"."mcps" TO "authenticated";
GRANT ALL ON TABLE "public"."mcps" TO "service_role";



GRANT ALL ON TABLE "public"."providers" TO "anon";
GRANT ALL ON TABLE "public"."providers" TO "authenticated";
GRANT ALL ON TABLE "public"."providers" TO "service_role";



GRANT ALL ON TABLE "public"."runs" TO "anon";
GRANT ALL ON TABLE "public"."runs" TO "authenticated";
GRANT ALL ON TABLE "public"."runs" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."versions" TO "anon";
GRANT ALL ON TABLE "public"."versions" TO "authenticated";
GRANT ALL ON TABLE "public"."versions" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_user" TO "anon";
GRANT ALL ON TABLE "public"."workspace_user" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_user" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER create_user_after_insert_user AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.insert_user();


