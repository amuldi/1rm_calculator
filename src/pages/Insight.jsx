import React, { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

function Insight() {
  const [rmStats, setRmStats] = useState([]);
  const [goalRate, setGoalRate] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [goalProgressData, setGoalProgressData] = useState([]);
  const [trendMessages, setTrendMessages] = useState([]);
  const [aiSummaries, setAiSummaries] = useState([]);
  const [volumeTrend, setVolumeTrend] = useState([]);
  const [groupedData, setGroupedData] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const matchDark = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDarkMode(document.documentElement.classList.contains("dark"));

      const updateMode = (e) => setIsDarkMode(e.matches);
      matchDark.addEventListener("change", updateMode);
      return () => matchDark.removeEventListener("change", updateMode);
    }
  }, []);

  useEffect(() => {
    const rmHistory = JSON.parse(localStorage.getItem("rmHistory")) || [];
    const rmGoals = JSON.parse(localStorage.getItem("rmGoals")) || {};
    const zoneHistory = JSON.parse(localStorage.getItem("zoneRecords")) || [];

    const exerciseMap = {
      "Bench Press": "벤치프레스",
      "Squat": "스쿼트",
      "Barbell Row": "바벨로우",
      "Deadlift": "데드리프트",
      "Overhead Press": "오버헤드프레스",
      
    };

    const tempGrouped = {};
    rmHistory.forEach((item) => {
      const original = item.exercise?.trim();
      const key = exerciseMap[original] || original;
      if (!tempGrouped[key]) tempGrouped[key] = [];
      tempGrouped[key].push(item.rm);
    });

    setGroupedData(tempGrouped);

    const stats = Object.entries(tempGrouped).map(([label, list]) => ({
      label,
      avg: list.reduce((a, b) => a + b, 0) / list.length,
    }));
    setRmStats(stats);

    const achieved = rmHistory.filter((r) => {
      const original = r.exercise?.trim();
      const mapped = exerciseMap[original] || original;
      const goal = rmGoals[mapped];
      return goal !== undefined && r.rm >= goal;
    }).length;

    const total = rmHistory.length;
    setGoalRate(total ? Math.round((achieved / total) * 100) : 0);

    const rawVolume = {};
    rmHistory.forEach((r) => {
      const day = new Date(r.date).toLocaleDateString("ko-KR");
      if (!rawVolume[day]) rawVolume[day] = 0;
      rawVolume[day] += r.weight * r.reps;
    });
    const volumeTrend = Object.entries(rawVolume)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, volume]) => ({ date, volume }));
    setVolumeTrend(volumeTrend);

    // 🎯 종목별 목표 달성률 도넛 그래프 데이터 계산
    const progressData = Object.entries(rmGoals).map(([original, goal]) => {
      const mapped = exerciseMap[original] || original;
      const rms = tempGrouped[mapped] || [];
      const achievedCount = rms.filter((rm) => rm >= goal).length;
      const percentage = rms.length ? Math.round((achievedCount / rms.length) * 100) : 0;
      return { exercise: original, percentage };
    });
    setGoalProgressData(progressData);

    // 📈 종목별 최근 기록 추세 메시지 계산
    const trendMsgs = Object.entries(tempGrouped).map(([exercise, rms]) => {
      const lastThree = rms.slice(-3);
      if (lastThree.length < 3) return { exercise, trend: "유지 중" };
      const diffs = [lastThree[1] - lastThree[0], lastThree[2] - lastThree[1]];
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      let trend = "유지 중";
      if (avgDiff > 0.5) trend = "상승 중";
      else if (avgDiff < -0.5) trend = "하락 중";
      return { exercise, trend };
    });
    setTrendMessages(trendMsgs);

    // 🧠 AI 통계 메시지 요약 생성 (랜덤 문구 선택)
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const progressMessages = [
      "Steady improvement in recent weeks.",
      "Great work! You're making gains.",
      "Progressing well—keep it going!",
    ];
    const stableMessages = [
      "Performance is consistent. Stay focused!",
      "Holding steady. Maintain the routine.",
      "Stable progress nice and controlled.",
    ];
    const regressingMessages = [
      "Performance has dipped. Consider reviewing your form.",
      "Regression detected rest or adjust your plan.",
      "You're losing ground. Reflect and refocus.",
    ];
    const summaries = trendMsgs.map(({ exercise, trend }) => {
      let message = "";
      if (trend === "상승 중") {
        message = `${exercise}: ${pick(progressMessages)}`;
      } else if (trend === "유지 중") {
        message = `${exercise}: ${pick(stableMessages)}`;
      } else if (trend === "하락 중") {
        message = `${exercise}: ${pick(regressingMessages)}`;
      }
      return { exercise, message };
    });
    setAiSummaries(summaries);

  }, []);

  const rmChartData = {
    labels: rmStats.map((s) => s.label),
    datasets: [
      {
        label: "Weekly average 1RM (kg)",
        data: rmStats.map((s) => s.avg.toFixed(1)),
        backgroundColor: [
          "#4ade80", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#34d399"
        ],
        borderRadius: 4,
        barThickness: 28,
      },
    ],
  };

  return (
    <div className="px-4 sm:px-6 py-12 space-y-10 bg-gradient-to-b from-white to-gray-50 dark:from-[#111] dark:to-[#1a1a1a] text-[#111] dark:text-white min-h-screen max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6">운동 분석 리포트</h1>

      <div className="grid gap-6">
        {/* Chart wrapper */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
          <h2 className="text-xl font-bold mb-4 text-center">종목별 평균 1RM</h2>
          <div className="h-[180px] sm:h-[240px] md:h-[300px]">
            <Bar
              data={rmChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  datalabels: { display: false },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200">
          <h2 className="text-xl font-bold mb-4 text-center">종목별 훈련량 </h2>
          <div className="h-[220px] sm:h-[280px] md:h-[320px]">
            <Doughnut
              data={{
                labels: Object.keys(groupedData),
                datasets: [
                  {
                    label: "훈련 횟수",
                    data: Object.values(groupedData).map((rms) => rms.length),
                    backgroundColor: [
                      "#4ade80", "#60a5fa", "#fbbf24", "#f87171",
                      "#a78bfa", "#f472b6", "#34d399",
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "60%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: isDarkMode ? "#fff" : "#111",
                      font: { size: 12, weight: "500" },
                      padding: 16,
                      boxWidth: 12,
                    },
                  },
                  datalabels: {
                    display: true,
                    color: isDarkMode ? "#fff" : "#000",
                    font: {
                      weight: "bold",
                      size: 12,
                    },
                    formatter: (value, context) => {
                      const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                      const percent = total ? (value / total) * 100 : 0;
                      return `${percent.toFixed(1)}%`;
                    },
                  },
                },
              }}
            />
          </div>
        </div>


      </div>
    </div>
  );
}

export default Insight