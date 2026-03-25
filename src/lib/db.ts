import { supabase } from './supabase'

export async function getPlayers(teamId?: string) {
    let query = supabase
        .from('players')
        .select('*')
        .order('full_name', { ascending: true })
        
    if (teamId) {
        query = query.eq('team_id', teamId)
    }
    
    const { data, error } = await query
    return { data, error }
}

export async function getMatches() {
    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false })
    return { data, error }
}

export async function getMatchStats(matchId: string) {
    const { data, error } = await supabase
        .from('match_stats')
        .select('*, players(*)')
        .eq('match_id', matchId)
    return { data, error }
}

export async function getPlayerStats(playerId: string) {
    const { data, error } = await supabase
        .from('match_stats')
        .select('*, matches(*)')
        .eq('player_id', playerId)
    return { data, error }
}
