import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer } from "lucide-react";

export function DailyOutlook({ dailyPreview, selectedDay, onSelectDay }) {
  return (
    <Card className="backdrop-blur bg-white/10 text-white border-white/20 shadow-lg">
      <CardHeader className="flex items-center gap-2">
        <Thermometer className="h-5 w-5" />
        <CardTitle>7-day outlook</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-4">
        {dailyPreview.map((day, idx) => {
          const isSelected =
            selectedDay?.type === "daily" && selectedDay.index === idx;
          return (
            <div
              key={day.date}
              className={`rounded-lg border bg-white/5 p-4 space-y-2 cursor-pointer ${
                isSelected ? "border-white/50" : "border-white/15"
              }`}
              onClick={() => onSelectDay(idx)}
            >
              <div className="text-sm text-white/80">
                {new Date(day.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
              <div className="text-sm text-white/80">{day.date}</div>
              <div className="text-2xl font-semibold">{day.avg}°</div>
              <div className="text-white/70 text-sm">High {day.max}° · Low {day.min}°</div>
              {day.condition && (
                <div className="text-sm text-white/80">Conditions: {day.condition}</div>
              )}
              <div className="text-sm text-white/70">{day.summary}</div>
            </div>
          );
        })}
        {!dailyPreview.length && (
          <p className="text-white/70">No daily outlook available.</p>
        )}
      </CardContent>
    </Card>
  );
}
