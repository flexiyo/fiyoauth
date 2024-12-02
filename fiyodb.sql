--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.4 (Ubuntu 16.4-0ubuntu0.24.04.2)

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
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: clip_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: kaushal
--

CREATE SEQUENCE public.clip_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clip_comments_id_seq OWNER TO kaushal;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clip_comments; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.clip_comments (
    id integer DEFAULT nextval('public.clip_comments_id_seq'::regclass) NOT NULL,
    clip_id uuid,
    user_avatar character varying(400),
    content character varying(1000) NOT NULL,
    user_id uuid,
    user_username character varying(255),
    replies jsonb
);


ALTER TABLE public.clip_comments OWNER TO kaushal;

--
-- Name: clip_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: kaushal
--

CREATE SEQUENCE public.clip_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clip_likes_id_seq OWNER TO kaushal;

--
-- Name: clip_likes; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.clip_likes (
    id integer DEFAULT nextval('public.clip_likes_id_seq'::regclass) NOT NULL,
    clip_id uuid,
    user_id uuid,
    user_username character varying(255),
    user_avatar character varying(500)
);


ALTER TABLE public.clip_likes OWNER TO kaushal;

--
-- Name: clips; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.clips (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    media_url character varying(500) NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_username character varying(255) NOT NULL,
    user_avatar character varying(400)
);


ALTER TABLE public.clips OWNER TO kaushal;

--
-- Name: post_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: kaushal
--

CREATE SEQUENCE public.post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_comments_id_seq OWNER TO kaushal;

--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.post_comments (
    id integer DEFAULT nextval('public.post_comments_id_seq'::regclass) NOT NULL,
    post_id uuid,
    user_username character varying(255),
    user_avatar character varying(400),
    content character varying(1000) NOT NULL,
    user_id uuid,
    replies jsonb
);


ALTER TABLE public.post_comments OWNER TO kaushal;

--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    post_id uuid,
    user_username character varying(255),
    user_avatar character varying(400),
    user_id uuid
);


ALTER TABLE public.post_likes OWNER TO kaushal;

--
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: kaushal
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_likes_id_seq OWNER TO kaushal;

--
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kaushal
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.posts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    media_url character varying(500) NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_username character varying(255) NOT NULL,
    user_avatar character varying(400)
);


ALTER TABLE public.posts OWNER TO kaushal;

--
-- Name: user_inventory; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.user_inventory (
    id integer NOT NULL,
    user_id uuid,
    posts jsonb,
    clips jsonb,
    tags jsonb
);


ALTER TABLE public.user_inventory OWNER TO kaushal;

--
-- Name: user_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: kaushal
--

CREATE SEQUENCE public.user_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_inventory_id_seq OWNER TO kaushal;

--
-- Name: user_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kaushal
--

ALTER SEQUENCE public.user_inventory_id_seq OWNED BY public.user_inventory.id;


--
-- Name: user_otps; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.user_otps (
    email character varying(255) NOT NULL,
    otp character(6) NOT NULL,
    sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_otps OWNER TO kaushal;

--
-- Name: users; Type: TABLE; Schema: public; Owner: kaushal
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    full_name character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    email character varying(255),
    gender character varying(50),
    dob date,
    profession character varying(255),
    bio character varying(150),
    account_type character varying(50) NOT NULL,
    is_private boolean NOT NULL,
    origin jsonb,
    created_at character varying(50) NOT NULL,
    avatar character varying(400),
    banner character varying(500),
    rooms jsonb,
    tokens jsonb,
    devices jsonb
);


ALTER TABLE public.users OWNER TO kaushal;

--
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- Name: user_inventory id; Type: DEFAULT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.user_inventory ALTER COLUMN id SET DEFAULT nextval('public.user_inventory_id_seq'::regclass);


--
-- Name: clip_comments clip_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.clip_comments
    ADD CONSTRAINT clip_comments_pkey PRIMARY KEY (id);


--
-- Name: clip_likes clip_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.clip_likes
    ADD CONSTRAINT clip_likes_pkey PRIMARY KEY (id);


--
-- Name: clips clips_pkey; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.clips
    ADD CONSTRAINT clips_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: users unique_email; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_email UNIQUE (email);


--
-- Name: users unique_username; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_username UNIQUE (username);


--
-- Name: user_inventory users_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.user_inventory
    ADD CONSTRAINT users_inventory_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_email; Type: INDEX; Schema: public; Owner: kaushal
--

CREATE INDEX idx_email ON public.users USING btree (email);


--
-- Name: idx_id; Type: INDEX; Schema: public; Owner: kaushal
--

CREATE INDEX idx_id ON public.users USING btree (id);


--
-- Name: idx_username; Type: INDEX; Schema: public; Owner: kaushal
--

CREATE INDEX idx_username ON public.users USING btree (username);


--
-- Name: clip_comments fk_clip_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.clip_comments
    ADD CONSTRAINT fk_clip_id FOREIGN KEY (clip_id) REFERENCES public.clips(id) ON DELETE SET NULL;


--
-- Name: clip_likes fk_clip_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.clip_likes
    ADD CONSTRAINT fk_clip_id FOREIGN KEY (clip_id) REFERENCES public.clips(id) ON DELETE SET NULL;


--
-- Name: post_comments fk_post_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT fk_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: post_likes fk_post_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT fk_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: posts fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clips fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.clips
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clip_likes fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.clip_likes
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_inventory fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.user_inventory
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: clip_comments fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.clip_comments
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: post_comments fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: post_likes fk_user_id; Type: FK CONSTRAINT; Schema: public; Owner: kaushal
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id);

--
-- PostgreSQL database dump complete
--

