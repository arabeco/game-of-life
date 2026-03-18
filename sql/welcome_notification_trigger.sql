-- Trigger to send a Welcome notification when a new user profile is created

CREATE OR REPLACE FUNCTION public.handle_new_user_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, content, metadata)
    VALUES (
        NEW.id,
        'system',
        'Bem-vindo ao Oráculo! Seu Starter Pack foi entregue. Explore as Arenas e o Planner para começar sua jornada.',
        jsonb_build_object('welcome', true)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON public.user_profiles;
CREATE TRIGGER on_auth_user_created_welcome
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_welcome_notification();
