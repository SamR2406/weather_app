import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HourlyCard({ hourlyPreview }) {
  return (
    <Card className="backdrop-blur bg-white/10 text-white border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle>Next hours</CardTitle>
        <CardDescription className="text-white/70">
          Temperature and feels-like snapshot
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3 text-sm">
        {hourlyPreview.map((hour) => (
          <div
            key={hour.time}
            className="rounded-lg border border-white/15 bg-white/5 p-3 text-center"
          >
            <div className="text-xs text-white/70">{hour.time}</div>
            <div className="mt-1 text-lg font-semibold">{hour.temperature}°</div>
            <div className="text-white/70">Feels {hour.feelsLike}°</div>
          </div>
        ))}
        {!hourlyPreview.length && (
          <p className="col-span-3 text-white/70">No hourly data available.</p>
        )}
      </CardContent>
    </Card>
  );
}
