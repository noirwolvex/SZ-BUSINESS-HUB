/*
  Create a SECURITY DEFINER function to retrieve a secret value from app_secrets.
  This allows the Next.js server runtime (which only has the anon key) to read
  specific API keys needed for server-side processing.

  The function only returns the value for keys that are explicitly allowlisted
  in the function body, so it cannot be used to dump arbitrary secrets.
*/

CREATE OR REPLACE FUNCTION public.get_app_secret(secret_key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow retrieving specific, known-safe keys
  IF secret_key NOT IN ('CLOUDMERSIVE_API_KEY') THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT value FROM app_secrets WHERE key = secret_key LIMIT 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_app_secret(text) TO anon, authenticated;
