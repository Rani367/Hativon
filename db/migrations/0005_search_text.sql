-- Search matches substrings with LIKE rather than Postgres full-text search.
-- Hebrew attaches prefixes to words (ב ה ו כ ל מ ש), so whole-word matching would
-- miss "בבית" when searching for "בית", and Postgres has no Hebrew stemmer.
--
-- Stored text and search terms both go through this one function, so they can't
-- drift apart.
CREATE OR REPLACE FUNCTION normalize_search_text(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT trim(regexp_replace(
    lower(
      -- Quotes, geresh and gershayim, so צה"ל and צהל match.
      regexp_replace(
        -- Niqqud and cantillation marks.
        regexp_replace(
          -- Markdown punctuation, including backslash escapes.
          regexp_replace(
            -- The blank-line marker and the Hebrew hyphen become spaces.
            regexp_replace(
              -- Images and links keep their text and lose their URL.
              regexp_replace(input, '!?\[([^\]]*)\]\([^)]*\)', '\1', 'g'),
              '&nbsp;|־', ' ', 'g'
            ),
            '[\\*_#>~`|]', '', 'g'
          ),
          '[֑-ׇֽֿׁׂׅׄ]', '', 'g'
        ),
        '["''׳״“”‘’]', '', 'g'
      )
    ),
    '\s+', ' ', 'g'
  ))
$$;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS search_text TEXT
  GENERATED ALWAYS AS (normalize_search_text(title || ' ' || content)) STORED;
