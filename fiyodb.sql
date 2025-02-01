--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.6 (Ubuntu 16.6-0ubuntu0.24.04.1)

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

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: delete_expired_tokens(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.delete_expired_tokens() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM tokens WHERE last_used < NOW() - INTERVAL '60 days';
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_rooms (
    id text NOT NULL,
    name text,
    type text NOT NULL,
    theme text DEFAULT 'default'::text,
    avatar text,
    members jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chat_rooms_type_check CHECK ((type = ANY (ARRAY['private'::text, 'group'::text, 'broadcast'::text])))
);


--
-- Name: clip_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clip_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clip_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clip_comments (
    id integer DEFAULT nextval('public.clip_comments_id_seq'::regclass) NOT NULL,
    clip_id uuid NOT NULL,
    content character varying(1000) NOT NULL,
    user_id uuid NOT NULL,
    replies jsonb,
    likes_count integer DEFAULT 0
);


--
-- Name: clip_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clip_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clip_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clip_likes (
    id integer DEFAULT nextval('public.clip_likes_id_seq'::regclass) NOT NULL,
    clip_id uuid NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: clips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clips (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_username character varying(255) NOT NULL,
    user_avatar character varying(400),
    media jsonb NOT NULL,
    likes_count bigint DEFAULT 0 NOT NULL,
    comments_count bigint DEFAULT 0 NOT NULL
);


--
-- Name: followers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.followers (
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    follow_status text DEFAULT 'pending'::text,
    accepted_at timestamp without time zone,
    CONSTRAINT follow_ids_not_equal CHECK ((follower_id <> following_id))
);


--
-- Name: mates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mates (
    initiator_id uuid NOT NULL,
    mate_id uuid NOT NULL,
    mate_status text DEFAULT 'pending'::text,
    accepted_at timestamp without time zone,
    CONSTRAINT mate_ids_not_equal CHECK ((initiator_id <> mate_id))
);


--
-- Name: post_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id integer DEFAULT nextval('public.post_comments_id_seq'::regclass) NOT NULL,
    post_id uuid NOT NULL,
    content character varying(1000) NOT NULL,
    user_id uuid NOT NULL,
    replies jsonb,
    likes_count integer DEFAULT 0
);


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_username character varying(255) NOT NULL,
    user_avatar character varying(400),
    media jsonb NOT NULL,
    likes_count bigint DEFAULT 0 NOT NULL,
    comments_count bigint DEFAULT 0 NOT NULL
);


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens (
    device_id uuid NOT NULL,
    user_id uuid,
    refresh_token text NOT NULL,
    device_name text,
    last_used timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    gender character varying(50),
    dob date,
    profession character varying(255),
    account_type character varying(50) NOT NULL,
    is_private boolean DEFAULT true,
    origin jsonb,
    avatar character varying(400) DEFAULT 'https://cdnfiyo.github.io/img/user/avatars/default-avatar.jpg'::character varying,
    banner character varying(500) DEFAULT 'https://cdnfiyo.github.io/img/user/banners/default-banner.jpg'::character varying,
    rooms jsonb,
    bio jsonb DEFAULT '{"text": "", "links": [], "track": {}}'::jsonb,
    created_at timestamp(6) without time zone DEFAULT now()
);


--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id, members);


--
-- Name: clip_comments clip_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip_comments
    ADD CONSTRAINT clip_comments_pkey PRIMARY KEY (id);


--
-- Name: clip_likes clip_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip_likes
    ADD CONSTRAINT clip_likes_pkey PRIMARY KEY (id);


--
-- Name: clips clips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clips
    ADD CONSTRAINT clips_pkey PRIMARY KEY (id);


--
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (follower_id, following_id);


--
-- Name: mates mates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mates
    ADD CONSTRAINT mates_pkey PRIMARY KEY (initiator_id, mate_id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (device_id);


--
-- Name: users unique_username; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_username UNIQUE (username);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_clip_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clip_comments_user_id ON public.clip_comments USING btree (user_id);


--
-- Name: idx_clip_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clip_likes_user_id ON public.clip_likes USING btree (user_id);


--
-- Name: idx_followers_follower_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_followers_follower_id ON public.followers USING btree (follower_id);


--
-- Name: idx_followers_following_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_followers_following_id ON public.followers USING btree (following_id);


--
-- Name: idx_mates_initiator_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mates_initiator_id ON public.mates USING btree (initiator_id);


--
-- Name: idx_mates_mate_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mates_mate_id ON public.mates USING btree (mate_id);


--
-- Name: idx_post_comments_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_comments_user_id ON public.post_comments USING btree (user_id);


--
-- Name: idx_post_likes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_post_likes_user_id ON public.post_likes USING btree (user_id);


--
-- Name: idx_users_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_id ON public.users USING btree (id);


--
-- Name: tokens trigger_delete_expired_tokens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_delete_expired_tokens BEFORE UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.delete_expired_tokens();


--
-- Name: clip_comments clip_comments_clip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip_comments
    ADD CONSTRAINT clip_comments_clip_id_fkey FOREIGN KEY (clip_id) REFERENCES public.clips(id) ON DELETE CASCADE;


--
-- Name: clip_comments clip_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip_comments
    ADD CONSTRAINT clip_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: clip_likes clip_likes_clip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip_likes
    ADD CONSTRAINT clip_likes_clip_id_fkey FOREIGN KEY (clip_id) REFERENCES public.clips(id) ON DELETE CASCADE;


--
-- Name: clip_likes clip_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip_likes
    ADD CONSTRAINT clip_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: clips clips_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clips
    ADD CONSTRAINT clips_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: followers followers_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: followers followers_following_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mates mates_initiator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mates
    ADD CONSTRAINT mates_initiator_id_fkey FOREIGN KEY (initiator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mates mates_mate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mates
    ADD CONSTRAINT mates_mate_id_fkey FOREIGN KEY (mate_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tokens tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

