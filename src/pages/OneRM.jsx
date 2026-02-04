import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

function OneRM() {
  const [exercise, setExercise] = useState("");
  const [exerciseDropdownOpen, setExerciseDropdownOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [goals, setGoals] = useState({});
  const [currentGoal, setCurrentGoal] = useState("");
  const [unit, setUnit] = useState("kg");
  const [filter, setFilter] = useState("all");
  const [isAchieved, setIsAchieved] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const exerciseMap = {
    "벤치프레스": "벤치프레스",
    "스쿼트": "스쿼트",
    "데드리프트": "데드리프트",
    "오버헤드프레스": "오버헤드프레스",
    "바벨로우": "바벨로우",
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("rmHistory");
    const savedGoals = localStorage.getItem("rmGoals");

    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      setGoals(parsedGoals);
    }
  }, []);

  useEffect(() => {
    if (exercise && goals[exercise]) {
      setCurrentGoal(goals[exercise]);
    } else {
      setCurrentGoal("");
    }
  }, [exercise, goals]);

  const convert = (value, toUnit) =>
    toUnit === "lb" ? value * 2.20462 : value / 2.20462;

  const handleCalculate = () => {
    if (!exercise || !weight || !reps) {
      alert("운동종목,무게,반복횟수를 입력하세요.");
      return;
    }

    // Normalize exercise name
    const normalizedExercise = exerciseMap[exercise?.trim()] || exercise;

    const w = parseFloat(weight);
    const r = parseInt(reps);
    const estimated1RM = w * (1 + r / 30);
    const finalResult = unit === "kg" ? estimated1RM : convert(estimated1RM, "lb");

    setResult(parseFloat(finalResult.toFixed(1)));
    setCurrentGoal(goals[normalizedExercise] || "");
    const date = new Date().toISOString().split("T")[0];
    const newRecord = {
      exercise: normalizedExercise,
      weight: w,
      reps: r,
      rm: parseFloat(finalResult.toFixed(1)),
      date,
      unit,
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("rmHistory", JSON.stringify(updatedHistory));

    const goalValue = goals[normalizedExercise];
    if (goalValue && finalResult >= goalValue) {
      setIsAchieved(true);
      setTimeout(() => setIsAchieved(false), 1000);
    } else {
      setIsAchieved(false);
    }
  };

  const handleGoalSave = () => {
    if (!exercise) {
      alert("목표 1RM을 설정하세요.");
      return;
    }

    const normalizedExercise = exerciseMap[exercise?.trim()] || exercise;

    const goalValue = parseFloat(currentGoal);
    if (isNaN(goalValue) || goalValue <= 0) {
      alert("목표 1RM을 설정하세요.");
      return;
    }

    const newGoals = { ...goals, [normalizedExercise]: goalValue };
    setGoals(newGoals);
    localStorage.setItem("rmGoals", JSON.stringify(newGoals));
    alert("저장완료");
  };

  const handleDeleteGoal = () => {
    if (!exercise) return;
    const normalizedExercise = exerciseMap[exercise?.trim()] || exercise;
    const updated = { ...goals };
    delete updated[normalizedExercise];
    setGoals(updated);
    localStorage.setItem("rmGoals", JSON.stringify(updated));
    setCurrentGoal("");
  };

  const now = new Date();
  const filtered = history.filter((item) => {
    const itemDate = new Date(item.date);
    if (filter === "week") return now - itemDate <= 7 * 86400000;
    if (filter === "month") return now - itemDate <= 30 * 86400000;
    return true;
  });

  const chartData = {
    labels: filtered.map((item) => item.date).reverse(),
    datasets: [
      {
        label: "1RM (kg)",
        data: filtered.map((item) => item.rm).reverse(),
        borderColor: "#111",
        backgroundColor: "#ddd",
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10 bg-gradient-to-b from-white to-gray-50 dark:from-[#111] dark:to-[#1a1a1a] text-[#111] dark:text-white min-h-screen">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">1RM 계산기</h1>

      {isAchieved && (
        <div className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-md p-4 text-center font-semibold animate-fade-in">
          목표 1RM 달성!
        </div>
      )}

      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 gap-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center"></h2>

        {/* 커스텀 드롭다운 */}
        <div className="mb-4">
          <button
            onClick={() => setExerciseDropdownOpen((prev) => !prev)}
            className="w-full text-left py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm sm:text-base font-semibold flex justify-between items-center hover:bg-gray-100 dark:hover:bg-[#222] transition focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
          >
            <span>{exercise || "운동 종목 선택"}</span>
            <span className="ml-2 text-base">{exerciseDropdownOpen ? "▴" : "▾"}</span>
          </button>

          {exerciseDropdownOpen && (
            <ul className="mt-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] shadow-sm max-h-60 overflow-y-auto">
              {Object.keys(exerciseMap).map((key) => (
                <li
                  key={key}
                  onClick={() => {
                    setExercise(key);
                    setExerciseDropdownOpen(false);
                  }}
                  className={`px-4 py-2 cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-[#333] ${exercise === key ? "bg-gray-100 dark:bg-[#222] font-bold" : ""}`}
                >
                  {key}
                </li>
              ))}
            </ul>
          )}
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            type="number"
            placeholder={`무게 (${unit})`}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm sm:text-base transition focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
          />
          <input
            type="number"
            placeholder="반복 횟수"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm sm:text-base transition focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
          />
        </div>

        <button
          onClick={handleCalculate}
          className="w-full py-3 px-4 bg-[#111] dark:bg-white text-white dark:text-black rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition duration-200"
        >
          계산하기
        </button>
      </div>

      {result !== null && (
        <div className="text-center text-2xl sm:text-3xl font-bold mt-2 transition-opacity animate-fade-in">
          예상 1RM: {result} {unit}
        </div>
      )}

      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 gap-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">목표 1RM </h2>
        <input
          type="number"
          placeholder={`목표 1RM (${unit})`}
          value={currentGoal}
          onChange={(e) => setCurrentGoal(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm transition focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleGoalSave}
            className="flex-1 py-3 px-4 bg-[#111] dark:bg-white text-white dark:text-black rounded-lg text-sm sm:text-base font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition duration-200"
          >
             저장
          </button>
          {goals[exerciseMap[exercise?.trim()] || exercise] && (
            <button
              onClick={handleDeleteGoal}
              className="flex-1 py-3 px-4 border border-gray-400 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-[#222] hover:scale-[1.02] active:scale-95 transition duration-200"
            >
               삭제
            </button>
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 gap-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">운동별 1RM 기록</h2>
          {Object.keys(exerciseMap).map((exKey) => {
            const group = filtered.filter((item) => item.exercise === exKey);
            
            if (group.length === 0) return null;

            const isOpen = expanded === exKey;

            return (
              <div key={exKey} className="mb-4">
                 <button
                  onClick={() => setExpanded(isOpen ? null : exKey)}
                  className="w-full text-left py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm font-semibold flex justify-between items-center hover:bg-gray-100 dark:hover:bg-[#222] transition focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
                >
                  <span>{exKey}</span>
                  <span className="ml-2 text-base">{isOpen ? "▴" : "▾"}</span>
                </button>

                {isOpen && (
                  <ul className="space-y-2 text-sm mt-2 max-h-64 overflow-y-auto">
                    {group.map((item, idx) => (
                      <li key={`${exKey}-${idx}`} className="flex justify-between items-center border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#1a1a1a] p-4 rounded-xl text-sm sm:text-base hover:shadow transition">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-0.5 sm:gap-4">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              {new Date(item.date).toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span className="text-sm sm:text-base ml-1">
                              {item.weight} {item.unit} × {item.reps}회{" "}
                              <span className="font-semibold text-blue-700 dark:text-blue-300">
                                →  {item.rm} {item.unit}
                              </span>
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const updated = [...history];
                              const indexToRemove = updated.findIndex(
                                (h) =>
                                  h.date === item.date &&
                                  h.exercise === item.exercise &&
                                  h.rm === item.rm &&
                                  h.weight === item.weight &&
                                  h.reps === item.reps
                              );
                              if (indexToRemove > -1) {
                                updated.splice(indexToRemove, 1);
                              }
                              setHistory(updated);
                              localStorage.setItem("rmHistory", JSON.stringify(updated));
                            }}
                            className="text-red-500 text-xs sm:text-sm hover:underline hover:opacity-80 transition"
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OneRM;
