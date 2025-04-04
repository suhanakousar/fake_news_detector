import * as React from "react";
import { 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

import { cn } from "@/lib/utils";

interface BaseChartProps {
  data: any[];
  height?: number;
  className?: string;
}

interface BarChartProps extends BaseChartProps {
  type: 'bar';
  xField: string;
  yField: string;
  colors?: string[];
}

interface PieChartProps extends BaseChartProps {
  type: 'pie';
  nameField: string;
  valueField: string;
  colors?: string[];
}

interface LineChartProps extends BaseChartProps {
  type: 'line';
  xField: string;
  yField: string;
  colors?: string[];
}

type ChartProps = BarChartProps | PieChartProps | LineChartProps;

const defaultColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444'];

export function Chart(props: ChartProps) {
  const { data, height = 300, className } = props;
  
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-4 text-gray-400", className)} style={{ height }}>
        No data available
      </div>
    );
  }

  if (props.type === 'bar') {
    const { xField, yField, colors = defaultColors } = props;
    
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yField} fill={colors[0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  if (props.type === 'pie') {
    const { nameField, valueField, colors = defaultColors } = props;
    
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={80}
              fill="#8884d8"
              dataKey={valueField}
              nameKey={nameField}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  if (props.type === 'line') {
    const { xField, yField, colors = defaultColors } = props;
    
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xField} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yField} stroke={colors[0]} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  return null;
}
