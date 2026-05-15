import { readFileSync, writeFileSync } from "node:fs";

writeFileSync("src/views/TodayView.tsx", `import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { WeatherWidget } from "@/components/WeatherWidget";

export function TodayView() {
  const { daysData, selectedDay, selectedDate, setSelectedDate, cycleDay, jumpToPlanDay } = useApp();
  if (!daysData || !selectedDay) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDay.date === today;
  const label = isToday ? "Heute \u00b7 " + selectedDay.label : "Gew\u00e4hlt \u00b7 " + selectedDay.label;

  return (
    <div className="view today-view">
      <WeatherWidget />
      <motion.div className="day-picker-wrap">
        <label htmlFor="dayPicker">Reisetag</label>
        <select id="dayPicker" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
          {daysData.days.map((d) => (
            <option key={d.date} value={d.date}>
              Tag {d.dayNumber} \u00b7 {d.label}{d.title ? " \u00b7 " + d.title : ""}
            </option>
          ))}
        </select>
      </motion.div>
    </div>
  );
}
`.replaceAll("motion.div", "motion.div"), "utf8");
