import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { categoryChartData, downloadsChartData } from "@/lib/data"

export function DashboardCharts() {
  return (
    <div className="grid gap-4 lg:grid-cols-7">
      <Card className="border-border/60 shadow-sm lg:col-span-4">
        <CardHeader>
          <CardTitle>Downloads Overview</CardTitle>
          <CardDescription>
            Monthly download volume across the library
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={downloadsChartData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-border"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                width={48}
                className="fill-muted-foreground"
              />
              <Tooltip
                cursor={{ fill: "oklch(0.95 0.015 255)" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid oklch(0.9 0.01 255)",
                  boxShadow: "0 8px 24px oklch(0 0 0 / 0.06)",
                  fontSize: 13,
                }}
              />
              <Bar
                dataKey="downloads"
                fill="oklch(0.45 0.1 255)"
                radius={[8, 8, 0, 0]}
                maxBarSize={42}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm lg:col-span-3">
        <CardHeader>
          <CardTitle>Resources by Category</CardTitle>
          <CardDescription>Distribution across top categories</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[280px] flex-col items-center justify-center gap-4">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={categoryChartData}
                dataKey="value"
                nameKey="name"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                strokeWidth={0}
              >
                {categoryChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid oklch(0.9 0.01 255)",
                  boxShadow: "0 8px 24px oklch(0 0 0 / 0.06)",
                  fontSize: 13,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex w-full flex-wrap justify-center gap-x-4 gap-y-2">
            {categoryChartData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
