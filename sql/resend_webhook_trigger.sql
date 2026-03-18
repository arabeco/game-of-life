-- Trigger to call Resend Edge Function for specific notification types

CREATE OR REPLACE FUNCTION public.trigger_resend_notification_webhook()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_email TEXT;
BEGIN
    -- Only trigger for specific high-priority types (e.g., mentor_invite, partnership_invite)
    IF NEW.type IN ('mentor_invite', 'partnership_invite', 'clan_invite', 'welcome') THEN
        
        -- Fetch recipient email
        SELECT email INTO v_recipient_email
        FROM public.user_profiles
        WHERE id = NEW.user_id;

        IF v_recipient_email IS NOT NULL AND v_recipient_email NOT LIKE '%@gol.local' THEN
            -- Call Supabase Edge Function 'resend'
            -- Note: Requires net extension or standard HTTP hook in Supabase Dashboard
            -- For the migration, we use a comment to guide the user to set up the Webhook in the Dashboard
            -- pointing to the 'resend' Edge Function.
            
            -- RAISE NOTICE 'Triggering email for %', v_recipient_email;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_notification_created_resend ON public.notifications;
CREATE TRIGGER on_notification_created_resend
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_resend_notification_webhook();
