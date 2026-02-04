import React, { useState } from "react";

function parseISODurationToMinutes(iso) {
  const match = iso.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
  const minutes = parseInt(match?.[1] || "0", 10);
  const seconds = parseInt(match?.[2] || "0", 10);
  return minutes + seconds / 60;
}

export default function Explore() {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState([]);
  // Separate state for reel and main videos
  const [reelVideos, setReelVideos] = useState([]);
  const [mainVideos, setMainVideos] = useState([]);
  const [recentKeywords, setRecentKeywords] = useState(
    JSON.parse(localStorage.getItem("recentKeywords") || "[]")
  );
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites") || "[]")
  );
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = async (customQuery) => {
    const base = customQuery || query;
    const searchTerm = `운동 ${base}`;
    if (!base) return;

    if (!customQuery) {
      const newKeywords = [query, ...recentKeywords.filter((k) => k !== query)].slice(0, 5);
      localStorage.setItem("recentKeywords", JSON.stringify(newKeywords));
      setRecentKeywords(newKeywords);
    }

    const apiKey = "AIzaSyDVRQfkR4iK7cRJhhfhcsqIcbRDtFfCze0";
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet,id&type=video&maxResults=20&q=${encodeURIComponent(
        searchTerm
      )}&key=${apiKey}`
    );
    const data = await response.json();
    const all = data.items || [];
    const ids = all.map((v) => v.id.videoId).join(",");
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${apiKey}`
    );
    const detailsData = await detailsResponse.json();
    const durationMap = {};
    (detailsData.items || []).forEach((item) => {
      durationMap[item.id] = item.contentDetails.duration;
    });
    const reels = [];
    const longs = [];
    all.forEach((video) => {
      const thumb = video.snippet.thumbnails?.medium;
      if (!thumb) return;
      const isoDuration = durationMap[video.id.videoId];
      if (!isoDuration) return;
      const minutes = parseISODurationToMinutes(isoDuration);
      if (minutes <= 1) {
        reels.push(video); // 릴스형
      } else {
        longs.push(video); // 롱폼형
      }
    });
    const MIN_LONGS = 12;

    let finalLongs = [...longs];
    if (finalLongs.length < MIN_LONGS) {
      const need = MIN_LONGS - finalLongs.length;
      finalLongs = [...finalLongs, ...reels.slice(0, need)];
    }

    setMainVideos(finalLongs.slice(0, 16));
    setReelVideos(reels.slice(0, 24));
  };

  const toggleFavorite = (video) => {
    const exists = favorites.some((v) => v.id.videoId === video.id.videoId);
    const updated = exists
      ? favorites.filter((v) => v.id.videoId !== video.id.videoId)
      : [video, ...favorites];
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  React.useEffect(() => {
    const defaultKeywords = ["헬스 운동", "스트레칭", "홈트레이닝", "맨몸운동", "운동 루틴", "코어 운동"];
    const randomKeyword = defaultKeywords[Math.floor(Math.random() * defaultKeywords.length)];
    handleSearch(randomKeyword);
  }, []);

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-[#111] dark:to-[#1c1c1c] text-[#111] dark:text-white font-sans">
      <h1 className="text-4xl font-extrabold text-center mb-4 tracking-tight"></h1>

      <div className="relative max-w-3xl mx-auto mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder="예: 스쿼트, 벤치프레스, 데드리프트"
            className="px-4 py-2 w-full sm:w-80 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-[#222] focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-shadow shadow-sm hover:shadow-md"
          >
            검색
          </button>
        </div>

        {isFocused && recentKeywords.length > 0 && (
          <div className="absolute z-10 left-1/2 -translate-x-1/2 mt-2 w-full sm:w-[30rem] bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-[#333]">
              {recentKeywords.map((word, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setQuery(word);
                    handleSearch();
                    setIsFocused(false);
                  }}
                  className="flex items-center gap-2 px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition"
                >
                  <span className="text-gray-400 dark:text-gray-500">⟳</span>
                  <span className="text-gray-800 dark:text-gray-200">{word}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
        
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-screen">
        {mainVideos.map((video) => (
          <a
            key={video.id.videoId}
            href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col"
          >
            <div
              onClick={(e) => {
                e.preventDefault();
                toggleFavorite(video);
              }}
              className="absolute top-2 right-2 bg-white dark:bg-[#222] rounded-full p-1.5 cursor-pointer shadow-md hover:scale-110 transition text-lg"
              title="즐겨찾기"
            >
              {favorites.some((v) => v.id.videoId === video.id.videoId) ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 dark:text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
            </div>
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="w-full h-44 object-cover"
            />
            <div className="p-3 flex flex-col gap-1 flex-grow">
              <div className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                {video.snippet.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
                {video.snippet.channelTitle} ·{" "}
                {new Date(video.snippet.publishedAt).toLocaleDateString("ko-KR")}
              </div>
            </div>
          </a>
        ))}
      </div>

      {reelVideos.length > 0 && (
        <div className="mt-20 border-t border-gray-300 dark:border-gray-700 pt-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            릴스 
          </h2>
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
            {reelVideos.map((video) => (
              <a
                key={`reel-${video.id.videoId}`}
                href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[180px] sm:min-w-[220px] snap-start rounded-xl overflow-hidden shadow-md bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
              >
                <img
                  src={video.snippet.thumbnails.high.url}
                  alt={video.snippet.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-2 text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                  {video.snippet.title}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}