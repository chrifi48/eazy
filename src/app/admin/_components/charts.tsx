"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui";

const BLUE = "#3B6FD4"; // readable on both light and dark surfaces
const ORANGE = "#F97316";
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };

export function Charts({ months, cats }: { months: { month: string; requests: number }[]; cats: { name: string; requests: number }[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Requests per month</h2>
        <div className="h-60" role="img" aria-label="Bar chart of requests per month">
          <ResponsiveContainer>
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="requests" fill={BLUE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Most requested categories</h2>
        <div className="h-60" role="img" aria-label="Bar chart of most requested categories">
          {cats.length ? (
            <ResponsiveContainer>
              <BarChart data={cats} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={110} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="requests" fill={ORANGE} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="grid h-full place-items-center text-sm text-muted-foreground">No data yet</p>}
        </div>
      </Card>
    </div>
  );
}
