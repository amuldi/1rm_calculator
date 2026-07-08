import React from "react";
import { Calculator } from "./components/Calculator";
import { ResultCard } from "./components/ResultCard";
import { GoalSetter } from "./components/GoalSetter";
import { RecordList } from "./components/RecordList";
import { use1RM } from "./hooks/use1RM";

export default function OneRMPage() {
  const {
    exerciseId, setExerciseId,
    weight, setWeight,
    reps, setReps,
    sets, setSets,
    rpe, setRpe,
    notes, setNotes,
    workoutDate, setWorkoutDate,
    result, allResults,
    errors,
    currentGoal, goalProgress,
    confidence, estimateRange,
    isPR,
    calculate,
  } = use1RM();

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-black" style={{ color: "var(--text-1)" }}>1RM 계산기</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>최대 1회 반복 중량을 추정합니다</p>
        </div>

        <Calculator
          onCalculate={calculate}
          exerciseId={exerciseId}
          setExerciseId={setExerciseId}
          weight={weight}
          setWeight={setWeight}
          reps={reps}
          setReps={setReps}
          sets={sets}
          setSets={setSets}
          rpe={rpe}
          setRpe={setRpe}
          notes={notes}
          setNotes={setNotes}
          workoutDate={workoutDate}
          setWorkoutDate={setWorkoutDate}
          errors={errors}
        />

        {result != null && (
          <ResultCard
            result={result}
            allResults={allResults}
            isPR={isPR}
            goalProgress={goalProgress}
            currentGoal={currentGoal}
            confidence={confidence}
            estimateRange={estimateRange}
          />
        )}

        <GoalSetter exerciseId={exerciseId} />
        <RecordList />
      </div>
    </div>
  );
}
