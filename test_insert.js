import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Starting test...");
    // Attempt to log in with the user's email to get their token.
    // NOTE: This assumes we know the password. If this is a Google only account, this will fail.
    // However, if we just want to see if the upsert works as an authenticated user, we can try.
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'anapssos0210@outlook.com',
        password: '010589'
    });

    if (authError) {
        console.log("LOGIN ERROR:", authError.message);
        console.log("Cannot test RLS because we need a valid session token to pass the RLS check for auth.uid() = id.");
        return;
    }

    const testId = authData.user.id;

    console.log(`Testing profile creation for ${testId}...`);

    const payload = {
        id: testId,
        email: 'anapssos0210@outlook.com',
        nickname: 'Ana',
        app_mode: 'GAME',
        sovereign: {
            body: 'body_masc_1',
            skinTone: '#FDBCB4',
            hairStyle: 'short',
            hairColor: '#2C1810',
            outfit: 'royal_robes',
            head_under: 'none',
            helmet: 'none',
            head_over: 'crown',
            artifact: 'none',
            glyph: 'none',
            aura: 'none'
        },
        avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocIsD4T8V2Gg_2z...',
        border: 'WOOD',
        level: 1,
        background_url: '',
        is_online: true,
        visible_widgets: ['consciencia.lema'],
        skin: 'STONE',
        unlocked_skins: {},
        unlocked_items: {},
        completed_season_missions: [],
        nobility: { exp: 0, rankId: 'plebeu' },
        mood: 100,
        chests: [],
        wallet: { gold: 0, fragments: 0 },
        is_premium: false
    };

    const { data, error } = await supabase
        .from('user_profiles')
        .upsert(payload)
        .select()
        .single();

    if (error) {
        console.error("INSERT FAILED:");
        console.error(error);
    } else {
        console.log("INSERT SUCCESSFUL:");
        console.log(data);
    }
}

testInsert();
