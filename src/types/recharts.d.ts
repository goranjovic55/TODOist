declare module 'recharts' {
  import * as React from 'react';

  export interface PieProps {
    data: any[];
    dataKey: string;
    cx?: string | number;
    cy?: string | number;
    labelLine?: boolean;
    label?: React.ReactNode | any;
    outerRadius?: number;
    fill?: string;
    children?: React.ReactNode;
  }

  export interface BarProps {
    dataKey: string;
    fill: string;
  }

  export interface TooltipProps {
    formatter?: (value: any, name?: string, props?: any) => any;
  }

  export class PieChart extends React.Component<{
    children?: React.ReactNode;
    width?: number | string;
    height?: number | string;
  }> {}

  export class BarChart extends React.Component<{
    data: any[];
    margin?: { top?: number, right?: number, bottom?: number, left?: number };
    children?: React.ReactNode;
  }> {}

  export class Pie extends React.Component<PieProps> {}
  export class Bar extends React.Component<BarProps> {}
  export class XAxis extends React.Component<{ dataKey: string }> {}
  export class YAxis extends React.Component<{}> {}
  export class CartesianGrid extends React.Component<{ strokeDasharray: string }> {}
  export class Tooltip extends React.Component<TooltipProps> {}
  export class Legend extends React.Component<{}> {}
  export class Cell extends React.Component<{ key: string, fill: string }> {}
  export class ResponsiveContainer extends React.Component<{
    width?: number | string;
    height?: number | string;
    children?: React.ReactNode;
  }> {}
} 