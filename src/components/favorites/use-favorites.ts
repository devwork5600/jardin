import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setFavoriteAction } from "@/lib/actions/favorites";

type FavoritesData = { signedIn: boolean; productIds: string[] };
const KEY = ["favorites"];

export function useFavorites() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<FavoritesData> => {
      const response = await fetch("/api/favorites");
      if (!response.ok) throw new Error(`Favoris indisponibles (${response.status})`);
      return response.json();
    },
  });
}

// Optimistic: the heart flips at once and rolls back if the server refuses.
export function useSetFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { productId: string; favorited: boolean }) => {
      const result = await setFavoriteAction(input);
      if (!result.ok) throw new Error(result.error);
    },
    onMutate: async ({ productId, favorited }) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<FavoritesData>(KEY);
      queryClient.setQueryData<FavoritesData>(KEY, (data) =>
        data
          ? {
              ...data,
              productIds: favorited
                ? [...new Set([...data.productIds, productId])]
                : data.productIds.filter((id) => id !== productId),
            }
          : data,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
