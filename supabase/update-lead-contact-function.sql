-- Function to calculate and update days_since_last_contact for a lead
-- Based on last OUTGOING email only (incoming emails don't reset the counter)

CREATE OR REPLACE FUNCTION public.calculate_lead_days_since_contact(
    p_lead_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    days_since_contact INTEGER,
    last_contact_at TIMESTAMPTZ
) AS $$
DECLARE
    v_thread_ids UUID[];
    v_last_outgoing_date TIMESTAMPTZ;
    v_first_incoming_date TIMESTAMPTZ;
    v_days INTEGER;
    v_last_contact TIMESTAMPTZ;
BEGIN
    -- Get all thread IDs for this lead
    SELECT ARRAY_AGG(id) INTO v_thread_ids
    FROM public.email_threads
    WHERE lead_id = p_lead_id AND user_id = p_user_id;

    -- If no threads, return 0
    IF v_thread_ids IS NULL OR array_length(v_thread_ids, 1) = 0 THEN
        RETURN QUERY SELECT 0::INTEGER, NULL::TIMESTAMPTZ;
        RETURN;
    END IF;

    -- Find the most recent OUTGOING email (user sent to lead)
    SELECT MAX(COALESCE(sent_at, received_at, created_at))
    INTO v_last_outgoing_date
    FROM public.emails
    WHERE thread_id = ANY(v_thread_ids)
      AND user_id = p_user_id
      AND (direction = 'outgoing' OR direction = 'outbound');

    IF v_last_outgoing_date IS NOT NULL THEN
        -- User has sent an email - use that timestamp
        v_last_contact := v_last_outgoing_date;
        v_days := EXTRACT(EPOCH FROM (NOW() - v_last_outgoing_date)) / 86400;
    ELSE
        -- No outgoing emails - use first incoming email timestamp
        SELECT MIN(COALESCE(received_at, sent_at, created_at))
        INTO v_first_incoming_date
        FROM public.emails
        WHERE thread_id = ANY(v_thread_ids)
          AND user_id = p_user_id
          AND (direction = 'incoming' OR direction = 'inbound');

        IF v_first_incoming_date IS NOT NULL THEN
            v_last_contact := v_first_incoming_date;
            v_days := EXTRACT(EPOCH FROM (NOW() - v_first_incoming_date)) / 86400;
        ELSE
            -- No emails at all
            RETURN QUERY SELECT 0::INTEGER, NULL::TIMESTAMPTZ;
            RETURN;
        END IF;
    END IF;

    RETURN QUERY SELECT v_days::INTEGER, v_last_contact;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lead contact info
CREATE OR REPLACE FUNCTION public.update_lead_contact_info(
    p_lead_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_days INTEGER;
    v_last_contact TIMESTAMPTZ;
BEGIN
    -- Calculate days since contact
    SELECT days_since_contact, last_contact_at
    INTO v_days, v_last_contact
    FROM public.calculate_lead_days_since_contact(p_lead_id, p_user_id);

    -- Update the lead
    UPDATE public.leads
    SET days_since_contact = v_days,
        last_contact_at = v_last_contact,
        updated_at = NOW()
    WHERE id = p_lead_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_lead_days_since_contact TO public;
GRANT EXECUTE ON FUNCTION public.update_lead_contact_info TO public;

