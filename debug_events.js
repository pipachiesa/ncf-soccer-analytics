import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zhxwfyprkrvofwckxxkq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoeHdmeXBya3J2b2Z3Y2t4eGtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNzkwMzYsImV4cCI6MjA4Mzc1NTAzNn0.PSBaHbozJ72jG0iH_iGGm8LCOI4D1uczjcKpmr6L0I4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvents() {
    console.log('Checking events types...');

    // Count distinct types in a match
    const { data: allEvents, error: e2 } = await supabase
        .from('events')
        .select('event_type, outcome')
        .eq('match_id', 'ncf_ave_maria'); // Use a known match id

    if (allEvents) {
        const counts = {};
        allEvents.forEach(e => {
            counts[e.event_type] = (counts[e.event_type] || 0) + 1;
        });
        console.log('Event Counts for ncf_ave_maria:', counts);

        // Check outcome for Duels
        const duels = allEvents.filter(e => e.event_type === 'Defensive Duel');
        console.log('Sample Defensive Duel outcomes:', duels.slice(0, 5).map(e => e.outcome));
    } else {
        console.log('No events found or error', e2);
    }
}

async function checkTeamStats() {
    console.log('Checking team_stats table...');
    const { data: stats, error } = await supabase
        .from('team_stats')
        .select('*')
        .limit(1);

    if (error) console.error('Error fetching team_stats:', error);
    else console.log('Team Stats Sample:', stats);
}

checkEvents();
checkTeamStats();
