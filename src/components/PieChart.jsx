import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { PieChart as EPieChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([TooltipComponent, LegendComponent, EPieChart, CanvasRenderer, LabelLayout]);

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function PieChart({ data, height = 220, donut = true }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(ref.current);
    }
    const chart = chartRef.current;

    const bg      = `hsl(${getCSSVar('--card')})`;
    const fg      = `hsl(${getCSSVar('--foreground')})`;
    const muted   = `hsl(${getCSSVar('--muted-foreground')})`;
    const border  = `hsl(${getCSSVar('--border')})`;

    chart.setOption({
      animation: true,
      animationDuration: 600,
      animationEasing: 'cubicOut',
      tooltip: {
        trigger: 'item',
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: fg, fontSize: 12 },
        formatter: (params) => `${params.marker}${params.name}: <strong>${params.value}</strong> (${params.percent}%)`,
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.15); border-radius: 8px;',
      },
      legend: {
        top: '4%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 14,
        borderRadius: 3,
        textStyle: { color: muted, fontSize: 11, fontWeight: 500 },
        icon: 'roundRect',
      },
      series: [{
        name: data.label,
        type: 'pie',
        radius: donut ? ['42%', '68%'] : '65%',
        center: ['50%', '62%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: 'transparent',
          borderWidth: 0,
        },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scale: false,
          itemStyle: {
            opacity: 0.8,
          },
          label: { show: false },
        },
        data: data.labels.map((label, i) => ({
          value: data.values[i],
          name: label,
          itemStyle: { color: data.colors[i] },
        })),
      }],
    });
  }, [data, donut]);

  useEffect(() => {
    const observer = new ResizeObserver(() => chartRef.current?.resize());
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => chartRef.current?.dispose(), []);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
