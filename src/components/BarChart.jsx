import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { BarChart as EBarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([TooltipComponent, GridComponent, EBarChart, CanvasRenderer]);

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function BarChart({ data, height = 220 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current);
    }
    const chart = chartRef.current;

    const bg     = `hsl(${getCSSVar('--card')})`;
    const fg     = `hsl(${getCSSVar('--foreground')})`;
    const muted  = `hsl(${getCSSVar('--muted-foreground')})`;
    const border = `hsl(${getCSSVar('--border')})`;

    chart.setOption({
      animation: true,
      animationDuration: 500,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'none',
        },
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: fg, fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.15); border-radius: 8px;',
      },
      legend: data.series?.length > 1 ? {
        bottom: 0,
        textStyle: { color: muted, fontSize: 11 },
      } : undefined,
      grid: { left: '2%', right: '2%', bottom: '4%', top: '6%', containLabel: true },
      xAxis: [{
        type: 'category',
        data: data.labels,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: {
          color: muted,
          fontSize: 11,
          fontWeight: 500,
          interval: data.labels.length > 14 ? Math.ceil(data.labels.length / 12) : 0,
        },
      }],
      yAxis: [{
        type: 'value',
        axisLabel: { color: muted, fontSize: 11 },
        splitLine: { lineStyle: { color: border, type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      }],
      series: (data.series?.length ? data.series : [data]).map((item) => ({
        name: item.label,
        type: 'bar',
        barMaxWidth: data.series?.length > 1 ? 32 : 48,
        data: item.values.map((value, index) => {
          const color = item.colors?.[index] || item.color || data.colors?.[index] || 'hsl(var(--primary))';
          return {
            value,
            itemStyle: { color, borderRadius: [6, 6, 0, 0] },
            emphasis: {
              itemStyle: { color, opacity: 0.8, borderRadius: [6, 6, 0, 0] },
            },
          };
        }),
      })),
    });
  }, [data]);

  useEffect(() => {
    const observer = new ResizeObserver(() => chartRef.current?.resize());
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => chartRef.current?.dispose(), []);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
