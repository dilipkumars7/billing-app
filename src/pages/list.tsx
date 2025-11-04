import { useEffect, useState } from "react";
import Table from "../components/Table";

export default function MovieList() {
  const [TableHeader, setTableHeader] = useState<any[]>([]);
  const [TableData, setTableData] = useState<any[]>([]);

  const API_URL =
    "https://api.themoviedb.org/3/discover/movie?api_key=ecd1484bdf4c4701a8e2c072903553ee&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false";

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.results.length > 0) {
          // ✅ Keep only desired fields
          const desiredFields = [
            "title",
            "release_date",
            "original_language",
            "popularity",
            "vote_average",
            "vote_count",
            "overview",
          ];

          const getWidth = (key: string) => {
            const baseWidth = 150;
            const extraPerChar = 10; // adjust for longer names
            const minWidth = 120;
            const maxWidth = 400;
            const width = baseWidth + key.length * extraPerChar;
            return Math.min(Math.max(width, minWidth), maxWidth); // clamp between min and max
          };

          // ✅ Generate headers only for desired fields
          const headers = desiredFields.map((key) => ({
            headerName: key.replace(/_/g, " ").toUpperCase(),
            field: key,
            defaultWidth: getWidth(key),
          }));

          // ✅ Filter data to include only desired fields
          const filteredData = data.results.map((movie: any) => {
            const filtered: Record<string, any> = {};
            desiredFields.forEach((field) => {
              filtered[field] = movie[field];
            });
            return filtered;
          });

          setTableHeader(headers);
          setTableData(filteredData);
        }
      })
      .catch((err) => console.error("API Error:", err));
  }, []);

  return (
    <div>
      <h3>🎬 Popular Movies (From TMDB API)</h3>

      {TableHeader.length > 0 ? (
        <Table TableHeader={TableHeader} TableData={TableData} />
      ) : (
        <p>Loading movies...</p>
      )}
    </div>
  );
}
