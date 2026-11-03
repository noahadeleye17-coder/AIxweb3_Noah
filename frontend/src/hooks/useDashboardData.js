import { useEffect, useState, useCallback, useMemo } from "react";
import { loadAll } from "../lib/api";
import { readGoal } from "../lib/savingsContract";
import { monthsUntil } from "../lib/pace";

const ACTIVE_GOAL_KEY = "activeGoal";

function readSavedGoal() {
  try {
    const raw = localStorage.getItem(ACTIVE_GOAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const targetAmount = Number(parsed?.targetAmount);
    if (!(targetAmount > 0) || !parsed?.targetDate) return null;
    return { targetAmount, targetDate: parsed.targetDate, active: true };
  } catch {
    return null;
  }
}

function saveActiveGoal(goal) {
  try {
    localStorage.setItem(
      ACTIVE_GOAL_KEY,
      JSON.stringify({
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate,
      }),
    );
  } catch {}
}

function toViewGoal(goal) {
  if (!goal?.active) return null;
  const seconds = Number(goal.targetDate);
  return {
    targetAmount: Number(goal.targetAmount) || 0,
    targetDate:
      Number.isFinite(seconds) && seconds > 0
        ? new Date(seconds * 1000).toISOString().slice(0, 10)
        : goal.targetDate,
    active: true,
    totalContributed: Number(goal.totalContributed) || 0,
  };
}

export function useDashboardData(wallet) {
  const signer = wallet?.signer;
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null,
  });
  const [onchainGoal, setOnchainGoal] = useState(null);
  const [savedGoal, setSavedGoal] = useState(readSavedGoal);
  const [goalVersion, setGoalVersion] = useState(0);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    loadAll()
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((e) => setState({ loading: false, error: e.message, data: null }));
  }, []);

  const refreshGoal = useCallback(
    async ({ save = false } = {}) => {
      if (!signer) return null;
      const goal = toViewGoal(await readGoal(signer));
      setOnchainGoal(goal);
      if (save && goal) {
        setSavedGoal(goal);
        saveActiveGoal(goal);
      }
      return goal;
    },
    [signer],
  );

  const onGoalCreated = useCallback(
    async ({ refreshInsights = false } = {}) => {
      const goal = await refreshGoal({ save: true });
      if (refreshInsights) setGoalVersion((v) => v + 1);
      return goal;
    },
    [refreshGoal],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (wallet?.status === "connected" && !wallet?.wrongNetwork && signer) {
      refreshGoal().catch(() => {});
    }
  }, [wallet?.status, wallet?.wrongNetwork, signer, refreshGoal]);

  const data = useMemo(() => {
    const base = state.data;
    if (!base) return base;

    const override = onchainGoal?.active ? onchainGoal : savedGoal;
    const now = new Date();
    const contributions = base.savings.contributions || [];
    const firstMonth = contributions[0]?.month;
    const rawStart = firstMonth
      ? new Date(
          String(firstMonth).length === 7
            ? `${firstMonth}-01T00:00:00`
            : firstMonth,
        )
      : new Date(now);
    const planStart = Number.isNaN(rawStart.getTime()) ? new Date(now) : rawStart;
    const targetDate = override?.active ? override.targetDate : base.goal.targetDate;
    const planMonths = Math.max(1, monthsUntil(targetDate, planStart));
    const planMonth = Math.min(
      planMonths,
      monthsUntil(now, planStart) + 1,
    );

    if (!override?.active) {
      return {
        ...base,
        goal: { ...base.goal, planMonths, planMonth },
      };
    }

    const targetAmount = Number(override.targetAmount) || 0;
    const balance =
      Number(base.savings.currentBalance ?? base.goal.currentBalance) || 0;
    const amountRemaining = Math.max(0, targetAmount - balance);
    const progress = targetAmount
      ? Math.max(0, Math.min(100, Math.round((balance / targetAmount) * 100)))
      : 0;
    const monthsRemaining = monthsUntil(targetDate, now);
    const plannedMonthly = Math.ceil(targetAmount / planMonths);

    return {
      ...base,
      goal: {
        ...base.goal,
        targetAmount,
        targetDate,
        monthsRemaining,
        amountRemaining,
        progress,
        planMonths,
        planMonth,
      },
      savings: {
        ...base.savings,
        plannedMonthly,
        contributions: contributions.map((c) => ({
          ...c,
          planned: plannedMonthly,
        })),
      },
    };
  }, [state.data, onchainGoal, savedGoal]);

  return {
    ...state,
    data,
    reload,
    onchainGoal,
    refreshGoal,
    onGoalCreated,
    goalVersion,
  };
}
