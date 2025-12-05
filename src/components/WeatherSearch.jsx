import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function WeatherSearch({
  query,
  onQueryChange,
  onSubmit,
  suggestions,
  suggestionLoading,
  onSuggestionSelect,
  loading,
  error,
}) {
  return (
    <Card className="relative z-50 backdrop-blur bg-white/10 text-white border-white/20 shadow-lg">
      <CardHeader className="gap-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          Choose a city
        </CardTitle>
        <CardDescription className="text-white/70">
          We’ll fetch the current conditions and a quick outlook.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3 md:flex-row">
          <div className="relative z-50 w-full">
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Try Sheffield, London, Tokyo..."
              className="bg-white/80 text-foreground"
            />
            {(suggestions.length > 0 || suggestionLoading) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-white/30 bg-white text-foreground shadow-2xl">
                {suggestionLoading && (
                  <div className="px-3 py-2 text-sm text-gray-600">Searching…</div>
                )}
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.label}-${suggestion.latitude}-${suggestion.longitude}`}
                    type="button"
                    onClick={() => onSuggestionSelect(suggestion)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-slate-100"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div className="text-sm">
                      <div className="font-medium text-slate-900">
                        {suggestion.label}
                      </div>
                      {suggestion.admin1 && (
                        <div className="text-xs text-slate-600">
                          Region: {suggestion.admin1}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="md:w-auto"
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-100">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
