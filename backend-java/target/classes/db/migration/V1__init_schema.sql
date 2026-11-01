--
-- PostgreSQL database dump
--

\restrict V4aSzcD3WnDitfJ7SGJxeTE14o8qDao64S3o7fmAqXbvTEhc7jMHGTYOePziv7A

-- Dumped from database version 18.1 (Postgres.app)
-- Dumped by pg_dump version 18.1 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: account_group_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.account_group_type AS ENUM (
    'cash',
    'bank',
    'crypto',
    'goal'
);


--
-- Name: budget_period; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.budget_period AS ENUM (
    'day',
    'week',
    'month',
    'year'
);


--
-- Name: categorytype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.categorytype AS ENUM (
    'income',
    'expense'
);


--
-- Name: currency_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.currency_type AS ENUM (
    'BYN',
    'RUB',
    'USD',
    'EUR',
    'BTC',
    'ETH',
    'TON'
);


--
-- Name: currencyenum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.currencyenum AS ENUM (
    'BYN',
    'USD',
    'EUR',
    'RUB',
    'BTC',
    'ETH',
    'TON'
);


--
-- Name: operation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.operation_type AS ENUM (
    'income',
    'expense',
    'transfer'
);


--
-- Name: operationtype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.operationtype AS ENUM (
    'income',
    'expense',
    'transfer'
);


--
-- Name: create_account(integer, public.account_group_type, character varying, character varying, public.currency_type, numeric); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_account(IN p_user_id integer, IN p_account_group public.account_group_type, IN p_name character varying, IN p_account_type character varying, IN p_currency public.currency_type, IN p_balance numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO accounts (
        user_id,
        account_group,
        name,
        account_type,
        currency,
        balance,
        initial_balance
    )
    VALUES (
        p_user_id,
        p_account_group,
        p_name,
        p_account_type,
        p_currency,
        p_balance,
        p_balance
    );
END;
$$;


--
-- Name: create_budget(integer, numeric, public.currency_type, public.budget_period, date, date); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_budget(IN p_category_id integer, IN p_amount_limit numeric, IN p_currency public.currency_type, IN p_period public.budget_period, IN p_start_date date, IN p_end_date date)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO budgets (
        category_id,
        amount_limit,
        currency,
        period,
        start_date,
        end_date
    )
    VALUES (
        p_category_id,
        p_amount_limit,
        p_currency,
        p_period,
        p_start_date,
        p_end_date
    );
END;
$$;


--
-- Name: create_goal(integer, character varying, numeric, timestamp with time zone, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_goal(IN p_account_id integer, IN p_title character varying, IN p_target_amount numeric, IN p_deadline timestamp with time zone, IN p_category_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO goals (
        account_id,
        title,
        target_amount,
        deadline,
        category_id
    )
    VALUES (
        p_account_id,
        p_title,
        p_target_amount,
        p_deadline,
        p_category_id
    );
END;
$$;


--
-- Name: create_operation(integer, integer, character varying, numeric, character varying, timestamp with time zone, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_operation(IN p_account_id integer, IN p_category_id integer, IN p_type character varying, IN p_amount numeric, IN p_currency character varying, IN p_date_time timestamp with time zone, IN p_note text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO operations (
        account_id,
        category_id,
        type,
        amount,
        currency,
        date_time,
        note
    )
    VALUES (
        p_account_id,
        p_category_id,
        p_type,
        p_amount,
        p_currency,
        p_date_time,
        p_note
    );
END;
$$;


--
-- Name: create_tag(character varying, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_tag(IN p_name character varying, IN p_color character varying, IN p_icon character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO tags (
        name,
        color,
        icon
    )
    VALUES (
        p_name,
        p_color,
        p_icon
    );
END;
$$;


--
-- Name: get_account_balance(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_account_balance(acc_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    result NUMERIC;
BEGIN
    SELECT balance INTO result
    FROM accounts
    WHERE id = acc_id;

    RETURN COALESCE(result, 0);
END;
$$;


--
-- Name: get_account_expense(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_account_expense(p_account_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(SUM(amount), 0)
        FROM operations
        WHERE account_id = p_account_id
        AND amount < 0
    );
END;
$$;


--
-- Name: get_category_expense(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_category_expense(cat_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    total NUMERIC;
BEGIN
    SELECT SUM(amount) INTO total
    FROM operations
    WHERE category_id = cat_id
      AND type = 'expense';

    RETURN COALESCE(total, 0);
END;
$$;


--
-- Name: get_user_operations_count(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_operations_count(u_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    cnt INT;
BEGIN
    SELECT COUNT(*) INTO cnt
    FROM operations o
    JOIN accounts a ON o.account_id = a.id
    WHERE a.user_id = u_id;

    RETURN COALESCE(cnt, 0);
END;
$$;


--
-- Name: get_user_total_expense(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_total_expense(u_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    total NUMERIC;
BEGIN
    SELECT SUM(o.amount) INTO total
    FROM operations o
    JOIN accounts a ON o.account_id = a.id
    WHERE a.user_id = u_id
      AND o.type = 'expense';

    RETURN COALESCE(total, 0);
END;
$$;


--
-- Name: get_user_total_income(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_total_income(u_id integer) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    total NUMERIC;
BEGIN
    SELECT SUM(o.amount) INTO total
    FROM operations o
    JOIN accounts a ON o.account_id = a.id
    WHERE a.user_id = u_id
      AND o.type = 'income';

    RETURN COALESCE(total, 0);
END;
$$;


--
-- Name: log_account_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_account_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO logs (user_id, action, entity_type, entity_id)
    VALUES (NEW.user_id, 'CREATE_ACCOUNT', 'accounts', NEW.id);

    RETURN NEW;
END;
$$;


--
-- Name: log_operation_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_operation_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_id INT;
BEGIN
    SELECT user_id INTO v_user_id
    FROM accounts
    WHERE id = OLD.account_id;

    INSERT INTO logs (user_id, action, entity_type, entity_id)
    VALUES (v_user_id, 'DELETE_OPERATION', 'operations', OLD.id);

    RETURN OLD;
END;
$$;


--
-- Name: log_operation_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_operation_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_id INT;
BEGIN
    SELECT user_id
    INTO v_user_id
    FROM accounts
    WHERE id = NEW.account_id;

    INSERT INTO logs (
        user_id,
        action,
        entity_type,
        entity_id,
        created_at
    )
    VALUES (
        v_user_id,
        'INSERT_OPERATION',
        'operations',
        NEW.id,
        now()
    );

    RETURN NEW;
END;
$$;


--
-- Name: update_account_balance_after_delete(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_account_balance_after_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.type = 'expense' THEN
        UPDATE accounts
        SET balance = balance + OLD.amount
        WHERE id = OLD.account_id;
    ELSIF OLD.type = 'income' THEN
        UPDATE accounts
        SET balance = balance - OLD.amount
        WHERE id = OLD.account_id;
    END IF;

    RETURN OLD;
END;
$$;


--
-- Name: update_account_balance_after_insert(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_account_balance_after_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.type = 'expense' THEN
        UPDATE accounts
        SET balance = balance - NEW.amount
        WHERE id = NEW.account_id;
    ELSIF NEW.type = 'income' THEN
        UPDATE accounts
        SET balance = balance + NEW.amount
        WHERE id = NEW.account_id;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: update_budget_spent_amount(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_budget_spent_amount() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.type = 'expense' THEN
        UPDATE budgets
        SET spent_amount = spent_amount + NEW.amount
        WHERE category_id = NEW.category_id
          AND NEW.date_time::date BETWEEN start_date AND end_date;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    account_group public.account_group_type CONSTRAINT accounts_group_title_not_null NOT NULL,
    name character varying NOT NULL,
    short_name character varying,
    full_name character varying,
    account_type character varying DEFAULT 'cash'::character varying NOT NULL,
    currency public.currency_type NOT NULL,
    balance numeric(24,8) DEFAULT 0 NOT NULL,
    initial_balance numeric(24,8) DEFAULT 0 NOT NULL,
    goal_target numeric(24,8),
    goal_deadline timestamp with time zone,
    icon character varying,
    color character varying,
    is_hidden boolean DEFAULT false NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    fiat_rate numeric(18,8),
    user_id integer
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    operation_id integer NOT NULL,
    file_url text NOT NULL,
    mime_type character varying(100),
    file_name character varying(255),
    file_size integer,
    preview_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    id integer NOT NULL,
    category_id integer NOT NULL,
    amount_limit numeric(24,8) NOT NULL,
    currency public.currency_type NOT NULL,
    period public.budget_period DEFAULT 'month'::public.budget_period NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    spent_amount numeric(24,8) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    parent_id integer,
    color character varying,
    icon character varying,
    sort_order integer,
    is_hidden boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: crypto_assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crypto_assets (
    id integer NOT NULL,
    account_id integer NOT NULL,
    symbol character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(50),
    amount numeric(38,18) DEFAULT 0 NOT NULL,
    avg_buy_price numeric(38,10),
    current_price numeric(38,10),
    value numeric(38,10),
    pnl numeric(38,10),
    pnl_percent numeric(10,5),
    currency character varying(10) DEFAULT 'USD'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: crypto_assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crypto_assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: crypto_assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crypto_assets_id_seq OWNED BY public.crypto_assets.id;


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    id integer NOT NULL,
    currency public.currency_type NOT NULL,
    rate_to_usd numeric(18,8) NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exchange_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exchange_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_rates_id_seq OWNED BY public.exchange_rates.id;


--
-- Name: goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goals (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    account_id integer NOT NULL,
    target_amount numeric(24,8) NOT NULL,
    current_amount numeric(24,8) DEFAULT 0 NOT NULL,
    deadline timestamp with time zone,
    category_id integer,
    description text,
    icon character varying(255),
    color character varying(20),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(255) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_id_seq OWNED BY public.logs.id;


--
-- Name: merchants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merchants (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    legal_name character varying(255),
    description text,
    merchant_type character varying(50),
    logo_url text,
    icon character varying(255),
    country character varying(100),
    city character varying(100),
    category_id integer,
    is_favorite boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: merchants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.merchants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: merchants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.merchants_id_seq OWNED BY public.merchants.id;


--
-- Name: operation_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_tags (
    id integer NOT NULL,
    operation_id integer NOT NULL,
    tag_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: operation_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.operation_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: operation_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.operation_tags_id_seq OWNED BY public.operation_tags.id;


--
-- Name: operations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operations (
    id integer NOT NULL,
    account_id integer NOT NULL,
    category_id integer,
    type character varying NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency character varying(10) NOT NULL,
    date_time timestamp with time zone NOT NULL,
    merchant character varying,
    place character varying,
    recipient character varying,
    note text,
    photo_url text,
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    asset_id integer,
    related_account_id integer,
    transfer_id integer,
    CONSTRAINT check_amount_positive CHECK ((amount > (0)::numeric))
);


--
-- Name: operations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.operations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: operations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.operations_id_seq OWNED BY public.operations.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    color character varying(20),
    icon character varying(50),
    sort_order integer DEFAULT 0,
    is_system boolean DEFAULT false,
    is_archived boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    login character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vw_budget_control; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_budget_control AS
 SELECT b.id AS budget_id,
    c.name AS category_name,
    b.period,
    b.currency,
    b.amount_limit,
    COALESCE(exp.total_expense, (0)::numeric) AS total_expense,
    (b.amount_limit - COALESCE(exp.total_expense, (0)::numeric)) AS remaining_amount,
    round(
        CASE
            WHEN (b.amount_limit > (0)::numeric) THEN ((COALESCE(exp.total_expense, (0)::numeric) / b.amount_limit) * (100)::numeric)
            ELSE (0)::numeric
        END, 2) AS execution_percent,
        CASE
            WHEN (COALESCE(exp.total_expense, (0)::numeric) > b.amount_limit) THEN 'Превышен'::text
            WHEN (COALESCE(exp.total_expense, (0)::numeric) = b.amount_limit) THEN 'Исчерпан'::text
            ELSE 'В пределах лимита'::text
        END AS budget_status
   FROM ((public.budgets b
     LEFT JOIN public.categories c ON ((b.category_id = c.id)))
     LEFT JOIN ( SELECT o.category_id,
            sum(o.amount) AS total_expense
           FROM public.operations o
          WHERE ((o.type)::text = 'expense'::text)
          GROUP BY o.category_id) exp ON ((b.category_id = exp.category_id)));


--
-- Name: vw_category_expenses; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_category_expenses AS
 SELECT c.id AS category_id,
    c.name AS category_name,
    count(o.id) AS operations_count,
    COALESCE(sum(o.amount), (0)::numeric) AS total_expense
   FROM (public.categories c
     LEFT JOIN public.operations o ON ((o.category_id = c.id)))
  WHERE ((o.type)::text = 'expense'::text)
  GROUP BY c.id, c.name;


--
-- Name: vw_operations_full; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_operations_full AS
 SELECT o.id AS operation_id,
    o.date_time,
    o.type,
    o.amount,
    o.currency,
    o.note,
    a.id AS account_id,
    a.name AS account_name,
    c.id AS category_id,
    c.name AS category_name,
    u.id AS user_id,
    u.login AS user_login
   FROM (((public.operations o
     LEFT JOIN public.accounts a ON ((o.account_id = a.id)))
     LEFT JOIN public.categories c ON ((o.category_id = c.id)))
     LEFT JOIN public.users u ON ((a.user_id = u.id)));


--
-- Name: vw_operations_with_tags; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_operations_with_tags AS
 SELECT o.id AS operation_id,
    o.date_time,
    o.type,
    o.amount,
    o.currency,
    o.note,
    a.name AS account_name,
    c.name AS category_name,
    u.login AS user_login,
    COALESCE(string_agg((t.name)::text, ', '::text ORDER BY (t.name)::text), 'Без тегов'::text) AS tags
   FROM (((((public.operations o
     LEFT JOIN public.accounts a ON ((o.account_id = a.id)))
     LEFT JOIN public.users u ON ((a.user_id = u.id)))
     LEFT JOIN public.categories c ON ((o.category_id = c.id)))
     LEFT JOIN public.operation_tags ot ON ((o.id = ot.operation_id)))
     LEFT JOIN public.tags t ON ((ot.tag_id = t.id)))
  GROUP BY o.id, o.date_time, o.type, o.amount, o.currency, o.note, a.name, c.name, u.login;


--
-- Name: vw_user_accounts_balance; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_user_accounts_balance AS
 SELECT u.id AS user_id,
    u.login AS user_login,
    a.id AS account_id,
    a.name AS account_name,
    a.account_group,
    a.currency,
    a.balance
   FROM (public.users u
     LEFT JOIN public.accounts a ON ((a.user_id = u.id)));


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: crypto_assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crypto_assets ALTER COLUMN id SET DEFAULT nextval('public.crypto_assets_id_seq'::regclass);


--
-- Name: exchange_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates ALTER COLUMN id SET DEFAULT nextval('public.exchange_rates_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs ALTER COLUMN id SET DEFAULT nextval('public.logs_id_seq'::regclass);


--
-- Name: merchants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants ALTER COLUMN id SET DEFAULT nextval('public.merchants_id_seq'::regclass);


--
-- Name: operation_tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_tags ALTER COLUMN id SET DEFAULT nextval('public.operation_tags_id_seq'::regclass);


--
-- Name: operations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations ALTER COLUMN id SET DEFAULT nextval('public.operations_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: accounts accounts_group_title_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_group_title_name_key UNIQUE (account_group, name);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: crypto_assets crypto_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crypto_assets
    ADD CONSTRAINT crypto_assets_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_currency_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_currency_key UNIQUE (currency);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: merchants merchants_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_name_key UNIQUE (name);


--
-- Name: merchants merchants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_pkey PRIMARY KEY (id);


--
-- Name: operation_tags operation_tags_operation_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_tags
    ADD CONSTRAINT operation_tags_operation_id_tag_id_key UNIQUE (operation_id, tag_id);


--
-- Name: operation_tags operation_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_tags
    ADD CONSTRAINT operation_tags_pkey PRIMARY KEY (id);


--
-- Name: operations operations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: crypto_assets_account_symbol_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX crypto_assets_account_symbol_uidx ON public.crypto_assets USING btree (account_id, symbol);


--
-- Name: idx_accounts_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_user_id ON public.accounts USING btree (user_id);


--
-- Name: accounts trg_log_account_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_account_insert AFTER INSERT ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.log_account_insert();


--
-- Name: operations trg_log_operation_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_operation_delete AFTER DELETE ON public.operations FOR EACH ROW EXECUTE FUNCTION public.log_operation_delete();


--
-- Name: operations trg_log_operation_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_log_operation_insert AFTER INSERT ON public.operations FOR EACH ROW EXECUTE FUNCTION public.log_operation_insert();


--
-- Name: tags trg_tags_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: operations trg_update_balance_after_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_balance_after_delete AFTER DELETE ON public.operations FOR EACH ROW EXECUTE FUNCTION public.update_account_balance_after_delete();


--
-- Name: operations trg_update_balance_after_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_balance_after_insert AFTER INSERT ON public.operations FOR EACH ROW EXECUTE FUNCTION public.update_account_balance_after_insert();


--
-- Name: operations trg_update_budget_spent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_budget_spent AFTER INSERT ON public.operations FOR EACH ROW EXECUTE FUNCTION public.update_budget_spent_amount();


--
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: attachments attachments_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.operations(id) ON DELETE CASCADE;


--
-- Name: budgets budgets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: crypto_assets crypto_assets_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crypto_assets
    ADD CONSTRAINT crypto_assets_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: goals goals_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: goals goals_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: logs logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: merchants merchants_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: operation_tags operation_tags_operation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_tags
    ADD CONSTRAINT operation_tags_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES public.operations(id) ON DELETE CASCADE;


--
-- Name: operation_tags operation_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_tags
    ADD CONSTRAINT operation_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: operations operations_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: operations operations_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.crypto_assets(id);


--
-- Name: operations operations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: operations operations_related_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operations
    ADD CONSTRAINT operations_related_account_id_fkey FOREIGN KEY (related_account_id) REFERENCES public.accounts(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict V4aSzcD3WnDitfJ7SGJxeTE14o8qDao64S3o7fmAqXbvTEhc7jMHGTYOePziv7A

