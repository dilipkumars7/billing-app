import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { useApi } from "../hooks/useApi";
import { PATH } from "../constants/app.constant";

interface Movie {
  title: string;
  release_date: string;
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  overview: string;
}

const List: React.FC = () => {
  const { data, loading, error } = useApi<{ results: Movie[] }>(PATH.GET_MOVIE_DATA);
  const [tableHeader, setTableHeader] = useState<any[]>([]);
  const [tableData, setTableData] = useState<Movie[]>([]);

  useEffect(() => {
    if (data?.results?.length) {
      const desiredFields: (keyof Movie)[] = [
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
        const extraPerChar = 10;
        const minWidth = 120;
        const maxWidth = 400;
        const width = baseWidth + key.length * extraPerChar;
        return Math.min(Math.max(width, minWidth), maxWidth);
      };

      const headers = desiredFields.map((key) => ({
        headerName: key.replace(/_/g, " ").toUpperCase(),
        field: key,
        defaultWidth: getWidth(key),
      }));

      const filteredData = data.results.map((movie) => {
        const filtered: Partial<Movie> = {};
        desiredFields.forEach((field) => {
          filtered[field] = movie[field];
        });
        return filtered as Movie;
      });

      setTableHeader(headers);
      setTableData(filteredData);
    }
  }, [data]);

  if (loading) return <p>Loading movies...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h3>🎬 Popular Movies (From TMDB API)</h3>

      {tableHeader.length > 0 && tableData.length > 0 ? (
        <Table TableHeader={tableHeader} TableData={tableData} />
      ) : (
        <p>No movies found.</p>
      )}
    </div>
  );
};

export default List;
