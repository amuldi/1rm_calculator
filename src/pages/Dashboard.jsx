import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [today, setToday] = useState("");
  const [lastOneRM, setLastOneRM] = useState(null);
  const [goalRate, setGoalRate] = useState(0);
  const [bestPR, setBestPR] = useState(null);
  const [bestPRsByExercise, setBestPRsByExercise] = useState([]);
  const [rmGoals, setRmGoals] = useState({});
  const [rmHistory, setRmHistory] = useState([]);

  const exerciseMap = {
    "벤치프레스": "벤치프레스",
    "벤치 프레스": "벤치프레스",
    "스쿼트": "스쿼트",
    "바벨로우": "바벨로우",
    "데드리프트": "데드리프트",
    "오버헤드프레스": "오버헤드프레스",
    "오버헤드 프레스": "오버헤드프레스",
  };

  const convertToKorean = (exercise) => {
    const map = {
      "Bench Press": "벤치프레스",
      "Squat": "스쿼트",
      "Deadlift": "데드리프트",
      "Overhead Press": "오버헤드프레스",
      "Barbell Row": "바벨로우",
    };
    return map[exercise] || exercise;
  };

  const convertGoalsToKorean = (goals) => {
    const map = {
      "Bench Press": "벤치프레스",
      "Squat": "스쿼트",
      "Deadlift": "데드리프트",
      "Overhead Press": "오버헤드프레스",
      "Barbell Row": "바벨로우",
    };
    const newGoals = {};
    Object.keys(goals).forEach((key) => {
      const kKey = map[key] || key;
      newGoals[kKey] = goals[key];
    });
    return newGoals;
  };

  useEffect(() => {
    const dateObj = new Date();
    const options = { year: "numeric", month: "long", day: "numeric" };
    setToday(dateObj.toLocaleDateString("ko-KR", options));

    let rmHistoryData = JSON.parse(localStorage.getItem("rmHistory")) || [];
    const rmGoalsData = JSON.parse(localStorage.getItem("rmGoals")) || {};

    rmHistoryData = rmHistoryData.map((r) => ({
      ...r,
      exercise: convertToKorean(r.exercise?.trim() ?? "")
    }));

    // Insert latest calculated 1RM if present and not already in history
    let latestOneRM = JSON.parse(localStorage.getItem("latestOneRM"));
    if (latestOneRM) {
      latestOneRM.exercise = convertToKorean(latestOneRM.exercise?.trim() ?? "");
    }
    if (
      latestOneRM &&
      (!rmHistoryData.length ||
        rmHistoryData[0].rm !== latestOneRM.rm ||
        rmHistoryData[0].exercise !== latestOneRM.exercise)
    ) {
      rmHistoryData.unshift(latestOneRM);
    }

    setRmHistory(rmHistoryData);
    const convertedGoals = convertGoalsToKorean(rmGoalsData);
    setRmGoals(convertedGoals);

    if (rmHistoryData.length > 0) {
      setLastOneRM(rmHistoryData[0]);

      const total = rmHistoryData.length;
      const achieved = rmHistoryData.filter((r) => {
        const original = r.exercise?.trim();
        const mapped = exerciseMap[original] || original;
        const goal = rmGoalsData[mapped];
        return goal !== undefined && r.rm >= goal;
      }).length;

      setGoalRate(Math.round((achieved / total) * 100));

      const pr = rmHistoryData.reduce((max, cur) => (cur.rm > max.rm ? cur : max), rmHistoryData[0]);
      setBestPR(pr);

      const bestMap = {};
      rmHistoryData.forEach((r) => {
        const original = r.exercise?.trim();
        const mapped = exerciseMap[original] || original;
        if (!bestMap[mapped] || r.rm > bestMap[mapped].rm) {
          bestMap[mapped] = { ...r, exercise: mapped };
        }
      });
      const bestArr = Object.values(bestMap).sort((a, b) => a.exercise.localeCompare(b.exercise));
      setBestPRsByExercise(bestArr);
    }
  }, []);

  const gradientColors = [
    "from-gray-100 to-gray-200 dark:from-[#1e1e1e] dark:to-[#2a2a2a]"
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#f9f9f9] dark:bg-[#111] text-[#111] dark:text-white min-h-screen max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-center">대쉬보드</h1>

      <div className="grid gap-6">
        {/* 오늘 날짜 */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-md p-6 shadow-sm text-center space-y-1">
          <p className="text-xl sm:text-2xl font-semibold">{today}</p>
        </div>

        {/* 종목별 최고 기록 */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-md p-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">종목별 최고 기록</h2>
          {rmHistory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bestPRsByExercise.map((pr, index) => (
                <div
                  key={pr.exercise}
                  className={`rounded-xl p-5 bg-gradient-to-r ${gradientColors[0]} shadow-sm`}
                >
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {exerciseMap[pr.exercise?.trim()] || pr.exercise}
                  </div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 my-2">
                    {pr.rm} {pr.unit}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    {new Date(pr.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center">기록이 없습니다. </p>
          )}
        </div>

        {/* 종목별 목표 달성률 */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-md p-6 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">종목별 목표 달성률</h2>
          {rmHistory.length > 0 ? (
            (() => {
              const progressColors = ["bg-green-500", "bg-blue-500", "bg-pink-500", "bg-yellow-500", "bg-purple-500"];
              const allExercises = Array.from(
                new Set(
                  rmHistory
                    .map((r) => exerciseMap[r.exercise?.trim()] || r.exercise?.trim())
                    .filter((e) => {
                      const normalized = exerciseMap[e?.trim()] || e?.trim();
                      return rmGoals[normalized] !== undefined;
                    })
                )
              );
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allExercises.map((exercise, index) => {
                    const goal = rmGoals[exercise];
                    const records = rmHistory.filter((r) => {
                      const original = r.exercise?.trim();
                      const mapped = exerciseMap[original] || original;
                      return mapped === exercise;
                    });
                    const best = records.reduce((max, r) => (r.rm > max ? r.rm : max), 0);
                    const progress = goal !== undefined && best > 0
                      ? Math.min(100, Math.round((best / goal) * 100))
                      : 0;
                    const barColor = progressColors[index % progressColors.length];

                    return (
                      <div key={exercise} className={`rounded-xl p-5 bg-gradient-to-r ${gradientColors[0]} shadow-sm`}>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {exercise}
                        </div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-1">
                          목표: {goal ?? "없음"} / 현재: {best}
                        </div>
                        <div className="relative w-full h-4 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`${barColor} h-full transition-all`}
                            style={{ width: `${progress}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                            {progress}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-gray-400 text-center">기록이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;