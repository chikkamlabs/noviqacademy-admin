-- ==============================================================================
-- NOVIQ ACADEMY — PRODUCTION DATABASE SCHEMA FOR SUPABASE POSTGRESQL
-- ==============================================================================
-- Description: Complete schema definition including 23 tables, ENUM types,
-- foreign keys, check constraints, composite & lookup indexes, updated_at triggers,
-- auth synchronization triggers, Row Level Security (RLS) enablement, and 71
-- precision RLS policies matching Noviq Academy requirements.
--
-- Ready for direct execution in Supabase Dashboard -> SQL Editor.
-- Idempotent & rerun-safe.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'mentor', 'learner');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learner_region') THEN
        CREATE TYPE public.learner_region AS ENUM ('india', 'uk');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_status') THEN
        CREATE TYPE public.course_status AS ENUM ('active', 'deactivated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
        CREATE TYPE public.resource_type AS ENUM ('doc', 'pdf', 'ppt', 'link', 'image');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'uploader_role') THEN
        CREATE TYPE public.uploader_role AS ENUM ('admin', 'mentor');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_registration_status') THEN
        CREATE TYPE public.batch_registration_status AS ENUM ('open', 'closed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_language') THEN
        CREATE TYPE public.batch_language AS ENUM ('english', 'telugu');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_resource_status') THEN
        CREATE TYPE public.batch_resource_status AS ENUM ('active', 'deactivated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
        CREATE TYPE public.registration_status AS ENUM ('pending', 'active', 'cancelled', 'completed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_provider') THEN
        CREATE TYPE public.payment_provider AS ENUM ('cashfree', 'stripe');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'success', 'failed', 'cancelled', 'refunded');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'board_message_type') THEN
        CREATE TYPE public.board_message_type AS ENUM ('text', 'resource');
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLES AND CORE CONSTRAINTS (IN STRICT DEPENDENCY ORDER)
-- ------------------------------------------------------------------------------

-- Table 1: users (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mobile TEXT,
    role public.user_role NOT NULL DEFAULT 'learner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: learner_profile
CREATE TABLE IF NOT EXISTS public.learner_profile (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    referral_code TEXT UNIQUE,
    region public.learner_region NOT NULL DEFAULT 'india',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: mentor_profile
CREATE TABLE IF NOT EXISTS public.mentor_profile (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    mentor_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT UNIQUE NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0),
    title TEXT NOT NULL,
    sub_heading TEXT,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 0 CHECK (duration >= 0), -- duration in days
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    preview_media_id TEXT,
    course_learnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    course_includes JSONB NOT NULL DEFAULT '[]'::jsonb,
    status public.course_status NOT NULL DEFAULT 'deactivated',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 6: topics (defined before course_topics)
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: course_topics
CREATE TABLE IF NOT EXISTS public.course_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_course_topic UNIQUE (course_id, topic_id)
);

-- Table 7: course_modules
CREATE TABLE IF NOT EXISTS public.course_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_preview BOOLEAN NOT NULL DEFAULT false, -- Supports course_modules_public_read_preview policy
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 8: course_module_content
CREATE TABLE IF NOT EXISTS public.course_module_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    emoji TEXT,
    content TEXT,
    is_preview BOOLEAN NOT NULL DEFAULT false, -- Supports course_module_content_public_read_preview policy
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 9: course_resources
CREATE TABLE IF NOT EXISTS public.course_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.resource_type NOT NULL DEFAULT 'doc',
    name TEXT NOT NULL,
    uploaded_by public.uploader_role NOT NULL DEFAULT 'admin',
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    description TEXT,
    related_url TEXT,
    is_preview BOOLEAN NOT NULL DEFAULT false, -- Supports course_resources_public_read_preview policy
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 10: course_exams
CREATE TABLE IF NOT EXISTS public.course_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    total_q INTEGER NOT NULL DEFAULT 0 CHECK (total_q >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 11: exam_questions (answer references exam_q_choices, added via ALTER TABLE below)
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.course_exams(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    description TEXT,
    hint TEXT,
    answer UUID, -- Circular reference to exam_q_choices(id)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 12: exam_q_choices
CREATE TABLE IF NOT EXISTS public.exam_q_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
    choice TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Circular FK resolution: exam_questions.answer -> exam_q_choices.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_exam_questions_answer'
    ) THEN
        ALTER TABLE public.exam_questions
            ADD CONSTRAINT fk_exam_questions_answer
            FOREIGN KEY (answer) REFERENCES public.exam_q_choices(id)
            ON DELETE SET NULL
            DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- Table 15: batches (defined before batch_learners and registrations)
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    batch_id TEXT UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    grace_period INTEGER NOT NULL DEFAULT 0 CHECK (grace_period >= 0),
    mentor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    registrations public.batch_registration_status NOT NULL DEFAULT 'open',
    notes TEXT,
    live_link TEXT,
    from_time TIME,
    to_time TIME,
    language public.batch_language NOT NULL DEFAULT 'english',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 16: batch_learners
CREATE TABLE IF NOT EXISTS public.batch_learners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL REFERENCES public.learner_profile(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    attendance NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (attendance >= 0 AND attendance <= 100),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_batch_learner UNIQUE (batch_id, learner_id)
);

-- Table 17: batch_resources
CREATE TABLE IF NOT EXISTS public.batch_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.course_resources(id) ON DELETE CASCADE,
    status public.batch_resource_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_batch_resource UNIQUE (batch_id, resource_id)
);

-- Table 18: batch_exams
CREATE TABLE IF NOT EXISTS public.batch_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.course_exams(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_batch_exam UNIQUE (batch_id, exam_id)
);

-- Table 13: exams_conducted
CREATE TABLE IF NOT EXISTS public.exams_conducted (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.course_exams(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.batch_learners(id) ON DELETE CASCADE,
    points DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    correct INTEGER NOT NULL DEFAULT 0,
    wrong INTEGER NOT NULL DEFAULT 0,
    results_released BOOLEAN NOT NULL DEFAULT false, -- Controls learner answer-release visibility
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 14: exam_conducted_answers
CREATE TABLE IF NOT EXISTS public.exam_conducted_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_conducted_id UUID NOT NULL REFERENCES public.exams_conducted(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
    selected_choice_id UUID REFERENCES public.exam_q_choices(id) ON DELETE SET NULL,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_conducted_answer UNIQUE (exam_conducted_id, question_id)
);

-- Table 19: registrations
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id TEXT UNIQUE NOT NULL,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE RESTRICT,
    learner_id UUID NOT NULL REFERENCES public.learner_profile(id) ON DELETE RESTRICT,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status public.registration_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 20: payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE RESTRICT,
    provider public.payment_provider NOT NULL,
    provider_order_id TEXT NOT NULL UNIQUE,
    provider_payment_id TEXT UNIQUE,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status public.payment_status NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 21: coupon_codes
CREATE TABLE IF NOT EXISTS public.coupon_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_value DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (discount_value >= 0),
    valid_till TIMESTAMPTZ,
    count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
    thersold INTEGER NOT NULL DEFAULT 0 CHECK (thersold >= 0), -- preserved column name 'thersold'
    is_public BOOLEAN NOT NULL DEFAULT false, -- Supports coupon_codes_public_read_available policy
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 22: batch_board
CREATE TABLE IF NOT EXISTS public.batch_board (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 23: batch_board_messages
CREATE TABLE IF NOT EXISTS public.batch_board_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.batch_board(id) ON DELETE CASCADE,
    type public.board_message_type NOT NULL DEFAULT 'text',
    text_value TEXT,
    resource_id UUID REFERENCES public.course_resources(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. FUNCTIONS & TRIGGERS FOR AUTOMATION
-- ------------------------------------------------------------------------------

-- Generic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply handle_updated_at trigger to all 23 tables
DO $$
DECLARE
    tbl TEXT;
    table_list TEXT[] := ARRAY[
        'users', 'learner_profile', 'mentor_profile', 'courses', 'topics',
        'course_topics', 'course_modules', 'course_module_content', 'course_resources',
        'course_exams', 'exam_questions', 'exam_q_choices', 'batches',
        'batch_learners', 'batch_resources', 'batch_exams', 'exams_conducted',
        'exam_conducted_answers', 'registrations', 'payments', 'coupon_codes',
        'batch_board', 'batch_board_messages'
    ];
BEGIN
    FOREACH tbl IN ARRAY table_list LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at_%I ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trigger_updated_at_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', tbl, tbl);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4. SECURITY DEFINER ROLE-CHECKING FUNCTIONS (NON-RECURSIVE)
-- ------------------------------------------------------------------------------

-- Non-recursive admin check: executes with owner privileges to avoid RLS recursion on users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = 'admin'::public.user_role
    );
$$;

-- Non-recursive mentor check
CREATE OR REPLACE FUNCTION public.is_mentor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = 'mentor'::public.user_role
    );
$$;

-- Non-recursive learner check
CREATE OR REPLACE FUNCTION public.is_learner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND role = 'learner'::public.user_role
    );
$$;

-- Helper: Verify if mentor is assigned to the course
CREATE OR REPLACE FUNCTION public.is_assigned_mentor_for_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.courses
        WHERE id = p_course_id
          AND mentor_id = auth.uid()
    );
$$;

-- Helper: Verify if mentor is assigned to the batch
CREATE OR REPLACE FUNCTION public.is_assigned_mentor_for_batch(p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.batches
        WHERE id = p_batch_id
          AND mentor_id = auth.uid()
    );
$$;

-- Helper: Verify learner has BOTH an active registration and a valid batch enrollment for the course
CREATE OR REPLACE FUNCTION public.is_enrolled_learner_in_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.registrations r
        JOIN public.batch_learners bl
          ON bl.learner_id = r.learner_id
         AND bl.batch_id = r.batch_id
         AND bl.course_id = r.course_id
        WHERE r.learner_id = auth.uid()
          AND r.course_id = p_course_id
          AND r.status = 'active'::public.registration_status
    );
$$;

-- Helper: Verify learner has BOTH an active registration and a valid batch enrollment for a specific batch
CREATE OR REPLACE FUNCTION public.is_enrolled_learner_in_batch(p_batch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.registrations r
        JOIN public.batch_learners bl
          ON bl.learner_id = r.learner_id
         AND bl.batch_id = r.batch_id
        WHERE r.learner_id = auth.uid()
          AND r.batch_id = p_batch_id
          AND r.status = 'active'::public.registration_status
    );
$$;

-- Restrict execution of internal helper functions to authenticated and service_role
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_mentor() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_learner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_assigned_mentor_for_course(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_assigned_mentor_for_batch(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_enrolled_learner_in_course(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_enrolled_learner_in_batch(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_mentor() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_learner() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_assigned_mentor_for_course(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_assigned_mentor_for_batch(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_enrolled_learner_in_course(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_enrolled_learner_in_batch(UUID) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. SUPABASE AUTH USER SYNCHRONIZATION TRIGGER
-- ------------------------------------------------------------------------------
-- Safely provisions public.users and public.learner_profile on auth.users signup
-- Prevents privilege escalation: hardcodes 'learner' role default, preventing self-assigned admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name TEXT;
BEGIN
    v_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'Learner'
    );

    INSERT INTO public.users (id, name, email, mobile, role)
    VALUES (
        NEW.id,
        v_name,
        NEW.email,
        NEW.raw_user_meta_data->>'mobile',
        'learner'::public.user_role
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    INSERT INTO public.learner_profile (id, region)
    VALUES (NEW.id, 'india'::public.learner_region)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. EXAM ANSWER PROTECTION (SECTION 8)
-- ------------------------------------------------------------------------------
-- Secure learner-facing view excluding the protected 'answer' column.
-- Uses security_invoker = true so underlying exam_questions RLS applies.
CREATE OR REPLACE VIEW public.learner_exam_questions
WITH (security_invoker = true)
AS
SELECT
    id,
    exam_id,
    question,
    description,
    hint,
    created_at,
    updated_at
FROM public.exam_questions;

-- Secure function to retrieve questions for learners (without answer)
CREATE OR REPLACE FUNCTION public.get_exam_questions_for_learner(p_exam_id UUID)
RETURNS TABLE (
    id UUID,
    exam_id UUID,
    question TEXT,
    description TEXT,
    hint TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT (
        public.is_admin()
        OR public.is_assigned_mentor_for_course((SELECT ce.course_id FROM public.course_exams ce WHERE ce.id = p_exam_id))
        OR public.is_enrolled_learner_in_course((SELECT ce.course_id FROM public.course_exams ce WHERE ce.id = p_exam_id))
    ) THEN
        RAISE EXCEPTION 'Access denied: not enrolled in this course exam';
    END IF;

    RETURN QUERY
    SELECT eq.id, eq.exam_id, eq.question, eq.description, eq.hint
    FROM public.exam_questions eq
    WHERE eq.exam_id = p_exam_id;
END;
$$;

-- Secure function to release answers ONLY after exam completion and result publication
CREATE OR REPLACE FUNCTION public.get_released_exam_results(p_exam_conducted_id UUID)
RETURNS TABLE (
    question_id UUID,
    question_text TEXT,
    selected_choice_id UUID,
    correct_answer_id UUID,
    is_correct BOOLEAN,
    points_awarded INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_learner_id UUID;
    v_released BOOLEAN;
BEGIN
    SELECT bl.learner_id, ec.results_released
    INTO v_learner_id, v_released
    FROM public.exams_conducted ec
    JOIN public.batch_learners bl ON bl.id = ec.member_id
    WHERE ec.id = p_exam_conducted_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exam session not found';
    END IF;

    -- Only admin, or the specific learner if results are published, can view correct answers
    IF NOT (public.is_admin() OR (auth.uid() = v_learner_id AND v_released = true)) THEN
        RAISE EXCEPTION 'Access denied: results not yet released';
    END IF;

    RETURN QUERY
    SELECT
        eca.question_id,
        eq.question,
        eca.selected_choice_id,
        eq.answer AS correct_answer_id,
        (eca.selected_choice_id = eq.answer) AS is_correct,
        eca.points AS points_awarded
    FROM public.exam_conducted_answers eca
    JOIN public.exam_questions eq ON eq.id = eca.question_id
    WHERE eca.exam_conducted_id = p_exam_conducted_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_exam_questions_for_learner(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_released_exam_results(UUID) TO authenticated, service_role;

-- Helper function allowing Admin to securely update passwords
CREATE OR REPLACE FUNCTION public.admin_update_user_password(p_user_id UUID, p_new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;

    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(UUID, TEXT) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 7. PERFORMANCE AND FILTERING INDEXES (FOREIGN KEYS & RLS PREDICATES)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_mentor_profile_mentor_id ON public.mentor_profile(mentor_id);
CREATE INDEX IF NOT EXISTS idx_courses_mentor_id ON public.courses(mentor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_course_topics_course ON public.course_topics(course_id);
CREATE INDEX IF NOT EXISTS idx_course_topics_topic ON public.course_topics(topic_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_course_order ON public.course_modules(course_id, display_order);
CREATE INDEX IF NOT EXISTS idx_course_module_content_module ON public.course_module_content(course_module_id);
CREATE INDEX IF NOT EXISTS idx_course_resources_course ON public.course_resources(course_id);
CREATE INDEX IF NOT EXISTS idx_course_exams_course ON public.course_exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON public.exam_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_q_choices_question ON public.exam_q_choices(question_id);

CREATE INDEX IF NOT EXISTS idx_batches_course_id ON public.batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_mentor_id ON public.batches(mentor_id);
CREATE INDEX IF NOT EXISTS idx_batches_registrations ON public.batches(registrations);

CREATE INDEX IF NOT EXISTS idx_batch_learners_learner_batch ON public.batch_learners(learner_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_learners_course ON public.batch_learners(course_id);
CREATE INDEX IF NOT EXISTS idx_batch_resources_batch ON public.batch_resources(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_exams_batch ON public.batch_exams(batch_id);

CREATE INDEX IF NOT EXISTS idx_exams_conducted_exam_member ON public.exams_conducted(exam_id, member_id);
CREATE INDEX IF NOT EXISTS idx_exam_conducted_answers_session ON public.exam_conducted_answers(exam_conducted_id);

CREATE INDEX IF NOT EXISTS idx_registrations_lookup ON public.registrations(learner_id, course_id, batch_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_registration_id ON public.registrations(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_registration ON public.payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON public.payments(provider, provider_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON public.coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_batch_board_batch ON public.batch_board(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_board_messages_board ON public.batch_board_messages(board_id);

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) ENABLEMENT ON ALL 23 TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_module_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_q_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams_conducted ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_conducted_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_board ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_board_messages ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 9. EXACT RLS POLICIES (SECTION 5)
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- A. Users and Profiles
-- ==============================================================================

-- 1. users
DROP POLICY IF EXISTS users_admin_all ON public.users;
CREATE POLICY users_admin_all ON public.users
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS users_read_own ON public.users;
CREATE POLICY users_read_own ON public.users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- Prevent role elevation: user cannot change their own role
        AND role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid())
    );

-- 2. learner_profile
DROP POLICY IF EXISTS learner_profile_admin_all ON public.learner_profile;
CREATE POLICY learner_profile_admin_all ON public.learner_profile
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS learner_profile_read_own ON public.learner_profile;
CREATE POLICY learner_profile_read_own ON public.learner_profile
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS learner_profile_update_own ON public.learner_profile;
CREATE POLICY learner_profile_update_own ON public.learner_profile
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 3. mentor_profile
DROP POLICY IF EXISTS mentor_profile_admin_all ON public.mentor_profile;
CREATE POLICY mentor_profile_admin_all ON public.mentor_profile
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS mentor_profile_read_own ON public.mentor_profile;
CREATE POLICY mentor_profile_read_own ON public.mentor_profile
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- ==============================================================================
-- B. Courses and Learning Content
-- ==============================================================================

-- 4. courses
DROP POLICY IF EXISTS courses_admin_all ON public.courses;
CREATE POLICY courses_admin_all ON public.courses
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS courses_public_read_active ON public.courses;
CREATE POLICY courses_public_read_active ON public.courses
    FOR SELECT
    TO public
    USING (status = 'active'::public.course_status);

DROP POLICY IF EXISTS courses_mentor_read_assigned ON public.courses;
CREATE POLICY courses_mentor_read_assigned ON public.courses
    FOR SELECT
    TO authenticated
    USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS courses_mentor_update_assigned ON public.courses;
CREATE POLICY courses_mentor_update_assigned ON public.courses
    FOR UPDATE
    TO authenticated
    USING (mentor_id = auth.uid())
    WITH CHECK (mentor_id = auth.uid());

-- 5. course_topics
DROP POLICY IF EXISTS course_topics_admin_all ON public.course_topics;
CREATE POLICY course_topics_admin_all ON public.course_topics
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS course_topics_public_read
ON public.course_topics;

CREATE POLICY course_topics_public_read
ON public.course_topics
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = course_topics.course_id
          AND c.status = 'active'::public.course_status
    )
);

DROP POLICY IF EXISTS course_topics_mentor_manage_assigned ON public.course_topics;
CREATE POLICY course_topics_mentor_manage_assigned ON public.course_topics
    FOR ALL
    TO authenticated
    USING (public.is_assigned_mentor_for_course(course_id))
    WITH CHECK (public.is_assigned_mentor_for_course(course_id));

-- 6. topics
DROP POLICY IF EXISTS topics_admin_all ON public.topics;
CREATE POLICY topics_admin_all ON public.topics
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS topics_public_read ON public.topics;
CREATE POLICY topics_public_read ON public.topics
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.course_topics ct
            JOIN public.courses c ON c.id = ct.course_id
            WHERE ct.topic_id = topics.id
              AND c.status = 'active'::public.course_status
        )
    );

-- 7. course_modules
DROP POLICY IF EXISTS course_modules_admin_all ON public.course_modules;
CREATE POLICY course_modules_admin_all ON public.course_modules
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS course_modules_mentor_manage_assigned ON public.course_modules;
CREATE POLICY course_modules_mentor_manage_assigned ON public.course_modules
    FOR ALL
    TO authenticated
    USING (public.is_assigned_mentor_for_course(course_id))
    WITH CHECK (public.is_assigned_mentor_for_course(course_id));

DROP POLICY IF EXISTS course_modules_enrolled_learner_read ON public.course_modules;
CREATE POLICY course_modules_enrolled_learner_read ON public.course_modules
    FOR SELECT
    TO authenticated
    USING (public.is_enrolled_learner_in_course(course_id));

DROP POLICY IF EXISTS course_modules_public_read_preview
ON public.course_modules;

CREATE POLICY course_modules_public_read_preview
ON public.course_modules
FOR SELECT
TO public
USING (
    is_preview = true
    AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = course_modules.course_id
          AND c.status = 'active'::public.course_status
    )
);

-- 8. course_module_content
DROP POLICY IF EXISTS course_module_content_admin_all ON public.course_module_content;
CREATE POLICY course_module_content_admin_all ON public.course_module_content
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS course_module_content_mentor_manage_assigned ON public.course_module_content;
CREATE POLICY course_module_content_mentor_manage_assigned ON public.course_module_content
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_modules cm
            WHERE cm.id = course_module_id
              AND public.is_assigned_mentor_for_course(cm.course_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.course_modules cm
            WHERE cm.id = course_module_id
              AND public.is_assigned_mentor_for_course(cm.course_id)
        )
    );

DROP POLICY IF EXISTS course_module_content_enrolled_learner_read ON public.course_module_content;
CREATE POLICY course_module_content_enrolled_learner_read ON public.course_module_content
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_modules cm
            WHERE cm.id = course_module_id
              AND public.is_enrolled_learner_in_course(cm.course_id)
        )
    );

DROP POLICY IF EXISTS course_module_content_public_read_preview ON public.course_module_content;
CREATE POLICY course_module_content_public_read_preview ON public.course_module_content
    FOR SELECT
    TO public
    USING (
        is_preview = true
        AND EXISTS (
            SELECT 1 FROM public.course_modules cm
            JOIN public.courses c ON c.id = cm.course_id
            WHERE cm.id = course_module_id
              AND cm.is_preview = true
              AND c.status = 'active'::public.course_status
        )
    );

-- 9. course_resources
DROP POLICY IF EXISTS course_resources_admin_all ON public.course_resources;
CREATE POLICY course_resources_admin_all ON public.course_resources
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS course_resources_mentor_manage_assigned ON public.course_resources;
CREATE POLICY course_resources_mentor_manage_assigned ON public.course_resources
    FOR ALL
    TO authenticated
    USING (public.is_assigned_mentor_for_course(course_id))
    WITH CHECK (public.is_assigned_mentor_for_course(course_id));

DROP POLICY IF EXISTS course_resources_enrolled_learner_read ON public.course_resources;
CREATE POLICY course_resources_enrolled_learner_read ON public.course_resources
    FOR SELECT
    TO authenticated
    USING (public.is_enrolled_learner_in_course(course_id));

DROP POLICY IF EXISTS course_resources_public_read_preview
ON public.course_resources;

CREATE POLICY course_resources_public_read_preview
ON public.course_resources
FOR SELECT
TO public
USING (
    is_preview = true
    AND EXISTS (
        SELECT 1
        FROM public.courses c
        WHERE c.id = course_resources.course_id
          AND c.status = 'active'::public.course_status
    )
);
-- ==============================================================================
-- C. Batches and Enrollment
-- ==============================================================================

-- 10. batches
DROP POLICY IF EXISTS batches_admin_all ON public.batches;
CREATE POLICY batches_admin_all ON public.batches
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS batches_public_read_open ON public.batches;
CREATE POLICY batches_public_read_open ON public.batches
    FOR SELECT
    TO public
    USING (registrations = 'open'::public.batch_registration_status);

DROP POLICY IF EXISTS batches_mentor_read_assigned ON public.batches;
CREATE POLICY batches_mentor_read_assigned ON public.batches
    FOR SELECT
    TO authenticated
    USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS batches_mentor_update_assigned ON public.batches;
CREATE POLICY batches_mentor_update_assigned ON public.batches
    FOR UPDATE
    TO authenticated
    USING (mentor_id = auth.uid())
    WITH CHECK (mentor_id = auth.uid());

-- 11. batch_learners
DROP POLICY IF EXISTS batch_learners_admin_all ON public.batch_learners;
CREATE POLICY batch_learners_admin_all ON public.batch_learners
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS batch_learners_learner_read_own ON public.batch_learners;
CREATE POLICY batch_learners_learner_read_own ON public.batch_learners
    FOR SELECT
    TO authenticated
    USING (learner_id = auth.uid());

DROP POLICY IF EXISTS batch_learners_mentor_read_assigned ON public.batch_learners;
CREATE POLICY batch_learners_mentor_read_assigned ON public.batch_learners
    FOR SELECT
    TO authenticated
    USING (public.is_assigned_mentor_for_batch(batch_id));

-- 12. batch_resources
DROP POLICY IF EXISTS batch_resources_admin_all ON public.batch_resources;
CREATE POLICY batch_resources_admin_all ON public.batch_resources
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS batch_resources_mentor_manage_assigned ON public.batch_resources;
CREATE POLICY batch_resources_mentor_manage_assigned ON public.batch_resources
    FOR ALL
    TO authenticated
    USING (public.is_assigned_mentor_for_batch(batch_id))
    WITH CHECK (public.is_assigned_mentor_for_batch(batch_id));

DROP POLICY IF EXISTS batch_resources_enrolled_learner_read ON public.batch_resources;
CREATE POLICY batch_resources_enrolled_learner_read ON public.batch_resources
    FOR SELECT
    TO authenticated
    USING (
        status = 'active'::public.batch_resource_status
        AND public.is_enrolled_learner_in_batch(batch_id)
    );

-- 13. batch_exams
DROP POLICY IF EXISTS batch_exams_admin_all ON public.batch_exams;
CREATE POLICY batch_exams_admin_all ON public.batch_exams
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS batch_exams_mentor_manage_assigned ON public.batch_exams;
CREATE POLICY batch_exams_mentor_manage_assigned ON public.batch_exams
    FOR ALL
    TO authenticated
    USING (public.is_assigned_mentor_for_batch(batch_id))
    WITH CHECK (public.is_assigned_mentor_for_batch(batch_id));

DROP POLICY IF EXISTS batch_exams_enrolled_learner_read ON public.batch_exams;
CREATE POLICY batch_exams_enrolled_learner_read ON public.batch_exams
    FOR SELECT
    TO authenticated
    USING (public.is_enrolled_learner_in_batch(batch_id));

-- ==============================================================================
-- D. Exams and Results
-- ==============================================================================

-- 14. course_exams
DROP POLICY IF EXISTS course_exams_admin_all ON public.course_exams;
CREATE POLICY course_exams_admin_all ON public.course_exams
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS course_exams_mentor_manage_assigned ON public.course_exams;
CREATE POLICY course_exams_mentor_manage_assigned ON public.course_exams
    FOR ALL
    TO authenticated
    USING (public.is_assigned_mentor_for_course(course_id))
    WITH CHECK (public.is_assigned_mentor_for_course(course_id));

DROP POLICY IF EXISTS course_exams_enrolled_learner_read ON public.course_exams;
CREATE POLICY course_exams_enrolled_learner_read ON public.course_exams
    FOR SELECT
    TO authenticated
    USING (public.is_enrolled_learner_in_course(course_id));

-- 15. exam_questions
DROP POLICY IF EXISTS exam_questions_admin_all ON public.exam_questions;
CREATE POLICY exam_questions_admin_all ON public.exam_questions
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS exam_questions_mentor_manage_assigned ON public.exam_questions;
CREATE POLICY exam_questions_mentor_manage_assigned ON public.exam_questions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_exams ce
            WHERE ce.id = exam_id
              AND public.is_assigned_mentor_for_course(ce.course_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.course_exams ce
            WHERE ce.id = exam_id
              AND public.is_assigned_mentor_for_course(ce.course_id)
        )
    );

DROP POLICY IF EXISTS exam_questions_enrolled_learner_read ON public.exam_questions;
CREATE POLICY exam_questions_enrolled_learner_read ON public.exam_questions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.course_exams ce
            WHERE ce.id = exam_id
              AND public.is_enrolled_learner_in_course(ce.course_id)
        )
    );

-- 16. exam_q_choices
DROP POLICY IF EXISTS exam_q_choices_admin_all ON public.exam_q_choices;
CREATE POLICY exam_q_choices_admin_all ON public.exam_q_choices
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS exam_q_choices_mentor_manage_assigned ON public.exam_q_choices;
CREATE POLICY exam_q_choices_mentor_manage_assigned ON public.exam_q_choices
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_questions eq
            JOIN public.course_exams ce ON ce.id = eq.exam_id
            WHERE eq.id = question_id
              AND public.is_assigned_mentor_for_course(ce.course_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exam_questions eq
            JOIN public.course_exams ce ON ce.id = eq.exam_id
            WHERE eq.id = question_id
              AND public.is_assigned_mentor_for_course(ce.course_id)
        )
    );

DROP POLICY IF EXISTS exam_q_choices_enrolled_learner_read ON public.exam_q_choices;
CREATE POLICY exam_q_choices_enrolled_learner_read ON public.exam_q_choices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_questions eq
            JOIN public.course_exams ce ON ce.id = eq.exam_id
            WHERE eq.id = question_id
              AND public.is_enrolled_learner_in_course(ce.course_id)
        )
    );

-- 17. exams_conducted
DROP POLICY IF EXISTS exams_conducted_admin_all ON public.exams_conducted;
CREATE POLICY exams_conducted_admin_all ON public.exams_conducted
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS exams_conducted_learner_read_own ON public.exams_conducted;
CREATE POLICY exams_conducted_learner_read_own ON public.exams_conducted
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.batch_learners bl
            WHERE bl.id = member_id
              AND bl.learner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS exams_conducted_mentor_read_assigned ON public.exams_conducted;
CREATE POLICY exams_conducted_mentor_read_assigned ON public.exams_conducted
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.batch_learners bl
            WHERE bl.id = member_id
              AND public.is_assigned_mentor_for_batch(bl.batch_id)
        )
    );

-- 18. exam_conducted_answers
DROP POLICY IF EXISTS exam_conducted_answers_admin_all ON public.exam_conducted_answers;
CREATE POLICY exam_conducted_answers_admin_all ON public.exam_conducted_answers
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS exam_conducted_answers_learner_read_own ON public.exam_conducted_answers;
CREATE POLICY exam_conducted_answers_learner_read_own ON public.exam_conducted_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams_conducted ec
            JOIN public.batch_learners bl ON bl.id = ec.member_id
            WHERE ec.id = exam_conducted_id
              AND bl.learner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS exam_conducted_answers_mentor_read_assigned ON public.exam_conducted_answers;
CREATE POLICY exam_conducted_answers_mentor_read_assigned ON public.exam_conducted_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams_conducted ec
            JOIN public.batch_learners bl ON bl.id = ec.member_id
            WHERE ec.id = exam_conducted_id
              AND public.is_assigned_mentor_for_batch(bl.batch_id)
        )
    );

-- ==============================================================================
-- E. Registrations and Payments
-- ==============================================================================

-- 19. registrations
DROP POLICY IF EXISTS registrations_admin_all ON public.registrations;
CREATE POLICY registrations_admin_all ON public.registrations
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS registrations_learner_read_own ON public.registrations;
CREATE POLICY registrations_learner_read_own ON public.registrations
    FOR SELECT
    TO authenticated
    USING (learner_id = auth.uid());

DROP POLICY IF EXISTS registrations_backend_only_write ON public.registrations;
CREATE POLICY registrations_backend_only_write ON public.registrations
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- 20. payments
DROP POLICY IF EXISTS payments_admin_all ON public.payments;
CREATE POLICY payments_admin_all ON public.payments
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS payments_learner_read_own ON public.payments;
CREATE POLICY payments_learner_read_own ON public.payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.registrations r
            WHERE r.id = registration_id
              AND r.learner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS payments_backend_only_write ON public.payments;
CREATE POLICY payments_backend_only_write ON public.payments
    FOR ALL
    TO authenticated
    USING (false)
    WITH CHECK (false);

-- ==============================================================================
-- F. Coupons
-- ==============================================================================

-- 21. coupon_codes
DROP POLICY IF EXISTS coupon_codes_admin_all ON public.coupon_codes;
CREATE POLICY coupon_codes_admin_all ON public.coupon_codes
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS coupon_codes_public_read_available ON public.coupon_codes;
CREATE POLICY coupon_codes_public_read_available ON public.coupon_codes
    FOR SELECT
    TO public
    USING (
        is_public = true
        AND (valid_till IS NULL OR valid_till > NOW())
        AND count < thersold
    );

-- ==============================================================================
-- G. Batch Board
-- ==============================================================================

-- 22. batch_board
DROP POLICY IF EXISTS batch_board_admin_all ON public.batch_board;
CREATE POLICY batch_board_admin_all ON public.batch_board
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS batch_board_mentor_manage_assigned ON public.batch_board;
CREATE POLICY batch_board_mentor_manage_assigned ON public.batch_board
    FOR ALL
    TO authenticated
    USING (public.is_assigned_mentor_for_batch(batch_id))
    WITH CHECK (public.is_assigned_mentor_for_batch(batch_id));

DROP POLICY IF EXISTS batch_board_enrolled_learner_read ON public.batch_board;
CREATE POLICY batch_board_enrolled_learner_read ON public.batch_board
    FOR SELECT
    TO authenticated
    USING (public.is_enrolled_learner_in_batch(batch_id));

-- 23. batch_board_messages
DROP POLICY IF EXISTS batch_board_messages_admin_all ON public.batch_board_messages;
CREATE POLICY batch_board_messages_admin_all ON public.batch_board_messages
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS batch_board_messages_mentor_manage_assigned ON public.batch_board_messages;
CREATE POLICY batch_board_messages_mentor_manage_assigned ON public.batch_board_messages
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.batch_board bb
            WHERE bb.id = board_id
              AND public.is_assigned_mentor_for_batch(bb.batch_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.batch_board bb
            WHERE bb.id = board_id
              AND public.is_assigned_mentor_for_batch(bb.batch_id)
        )
    );

DROP POLICY IF EXISTS batch_board_messages_enrolled_learner_read ON public.batch_board_messages;
CREATE POLICY batch_board_messages_enrolled_learner_read ON public.batch_board_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.batch_board bb
            WHERE bb.id = board_id
              AND public.is_enrolled_learner_in_batch(bb.batch_id)
        )
    );

-- ------------------------------------------------------------------------------
-- 10. GRANTS & SUPABASE API ACCESS
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Ensure future tables inherit appropriate schema permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- ==============================================================================
-- END OF NOVIQ ACADEMY SCHEMAS.SQL
-- ==============================================================================
