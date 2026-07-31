import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId } from "@/lib/utils";
import { mergeDeletedEntities, normalizeDeletedEntity } from "@/lib/syncModel";
import {
  normalizeMealRecord,
  normalizeNutritionGoal,
  normalizeFavorite,
  sumDailyMacros,
} from "@/features/nutrition/utils/nutritionMath";

function sortByNewest(records) {
  return [...records].sort((a, b) => {
    const aTime = new Date(a.date || a.createdAt || 0).getTime() || 0;
    const bTime = new Date(b.date || b.createdAt || 0).getTime() || 0;
    return bTime - aTime;
  });
}

function normalizeMeals(records) {
  if (!Array.isArray(records)) return [];
  return sortByNewest(records.map(normalizeMealRecord));
}

function normalizeDeletedMeals(records) {
  if (!Array.isArray(records)) return [];
  return mergeDeletedEntities(records, []);
}

function createDeletedMeal(recordOrId) {
  const now = new Date().toISOString();
  const id = typeof recordOrId === "string" ? recordOrId : recordOrId?.id;
  if (!id) return null;
  return normalizeDeletedEntity({
    id,
    deletedAt: now,
    updatedAt: now,
    syncVersion: (Number(recordOrId?.syncVersion) || 1) + 1,
  });
}

function normalizeFavorites(records) {
  if (!Array.isArray(records)) return [];
  return records.map(normalizeFavorite);
}

export const useNutritionStore = create(
  persist(
    (set, get) => ({
      meals: [],
      deletedMeals: [],
      goal: null,
      favorites: [],

      addMeal: (meal) => {
        const now = new Date().toISOString();
        const newMeal = normalizeMealRecord({
          ...meal,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          syncVersion: meal.syncVersion || 1,
          date: meal.date || now,
        });
        set((state) => ({ meals: [newMeal, ...state.meals] }));
        return newMeal;
      },

      updateMeal: (id, changes) =>
        set((state) => ({
          meals: normalizeMeals(
            state.meals.map((meal) =>
              meal.id === id
                ? normalizeMealRecord({
                    ...meal,
                    ...changes,
                    id: meal.id,
                    updatedAt: new Date().toISOString(),
                    syncVersion: (Number(meal.syncVersion) || 1) + 1,
                  })
                : meal
            )
          ),
        })),

      deleteMeal: (id) =>
        set((state) => {
          const meal = state.meals.find((m) => m.id === id);
          const tombstone = createDeletedMeal(meal || id);
          return {
            meals: state.meals.filter((m) => m.id !== id),
            deletedMeals: tombstone
              ? mergeDeletedEntities(state.deletedMeals, [tombstone])
              : state.deletedMeals,
          };
        }),

      clearMeals: () =>
        set((state) => ({
          meals: [],
          deletedMeals: mergeDeletedEntities(
            state.deletedMeals,
            state.meals.map(createDeletedMeal).filter(Boolean)
          ),
        })),

      importMeals: (meals) => set({ meals: normalizeMeals(meals) }),
      importDeletedMeals: (meals) => set({ deletedMeals: normalizeDeletedMeals(meals) }),

      setGoal: (goal) => {
        const now = new Date().toISOString();
        set((state) => ({
          goal: normalizeNutritionGoal({
            ...goal,
            createdAt: state.goal?.createdAt || now,
            updatedAt: now,
            syncVersion: (Number(state.goal?.syncVersion) || 1) + 1,
          }),
        }));
      },

      clearGoal: () => set({ goal: null }),
      importGoal: (goal) => set({ goal: normalizeNutritionGoal(goal) }),

      addFavorite: (favorite) => {
        const newFavorite = normalizeFavorite({ ...favorite, id: generateId() });
        set((state) => ({ favorites: [newFavorite, ...state.favorites] }));
        return newFavorite;
      },
      removeFavorite: (id) =>
        set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),
      importFavorites: (favorites) => set({ favorites: normalizeFavorites(favorites) }),

      getMealsByDate: (date) => {
        const day = typeof date === "string" ? date : new Date(date).toISOString().split("T")[0];
        return get().meals.filter((m) => m.date?.split("T")[0] === day);
      },

      getDailyTotals: (date) => sumDailyMacros(get().getMealsByDate(date)),

      getRecentDailyTotals: (days = 7) => {
        const byDate = {};
        for (const meal of get().meals) {
          const day = meal.date?.split("T")[0];
          if (!day) continue;
          if (!byDate[day]) byDate[day] = [];
          byDate[day].push(meal);
        }
        return Object.entries(byDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, days)
          .map(([date, meals]) => ({ date, ...sumDailyMacros(meals) }));
      },
    }),
    {
      name: "1rm-nutrition",
      version: 1,
      migrate: (state) => ({
        ...state,
        meals: normalizeMeals(state?.meals),
        deletedMeals: normalizeDeletedMeals(state?.deletedMeals),
        goal: normalizeNutritionGoal(state?.goal),
        favorites: normalizeFavorites(state?.favorites),
      }),
    }
  )
);
