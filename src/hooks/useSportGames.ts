import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SportGamesFilters {
  sport_type?: string;
  skill_level?: string;
  date?: string;
}

export const useSportGames = (filters: SportGamesFilters = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: games = [], isLoading } = useQuery({
    queryKey: ['sport_games', filters],
    queryFn: async () => {
      let query = (supabase.from('sport_games' as any) as any)
        .select('*, sport_courts(*), locations(*)')
        .order('game_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (filters.sport_type) query = query.eq('sport_type', filters.sport_type);
      if (filters.skill_level) query = query.eq('skill_level', filters.skill_level);
      if (filters.date) query = query.eq('game_date', filters.date);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Fetch current game state
      const { data: game, error: gameError } = await (supabase.from('sport_games' as any) as any)
        .select('current_players, max_players, status')
        .eq('id', gameId)
        .single();
      if (gameError) throw gameError;
      if (!game) throw new Error('Игра не найдена');

      // 2. Capacity / status guard
      if (game.current_players >= game.max_players || game.status !== 'open') {
        throw new Error('Игра уже заполнена');
      }

      // 3. Prevent duplicate participation
      const { data: existing } = await (supabase.from('game_participants' as any) as any)
        .select('id')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) throw new Error('Вы уже в этой игре');

      // 4. Insert participant
      const { error } = await (supabase.from('game_participants' as any) as any).insert({
        game_id: gameId,
        user_id: user.id,
        status: 'joined',
      });
      if (error) throw error;

      // 5. Update game player count + status
      const newCount = (game.current_players || 0) + 1;
      await (supabase.from('sport_games' as any) as any)
        .update({
          current_players: newCount,
          status: newCount >= game.max_players ? 'full' : 'open',
        })
        .eq('id', gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sport_games'] });
      queryClient.invalidateQueries({ queryKey: ['game_participants'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (gameId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase.from('game_participants' as any) as any)
        .update({ status: 'left' })
        .eq('game_id', gameId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sport_games'] });
      queryClient.invalidateQueries({ queryKey: ['game_participants'] });
    },
  });

  return {
    games,
    isLoading,
    joinGame: (gameId: string) => joinMutation.mutateAsync(gameId),
    leaveGame: (gameId: string) => leaveMutation.mutateAsync(gameId),
  };
};