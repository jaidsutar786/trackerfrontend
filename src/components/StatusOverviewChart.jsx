import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { TooltipComponent, GridComponent } from 'echarts/components';
import { PieChart, BarChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([TooltipComponent, GridComponent, PieChart, BarChart, CanvasRenderer, LabelLayout]);

function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function StatusOverviewChart({ data, type = 'pie', height = 260 }) {
  const ref = useRef(null);
  const chartRef = useRef(null);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    if (!chartRef.current) chartRef.current = echarts.init(ref.current);

    const chart = chartRef.current;
    const bg = `hsl(${getCSSVar('--card')})`;
    const fg = `hsl(${getCSSVar('--foreground')})`;
    const muted = `hsl(${getCSSVar('--muted-foreground')})`;
    const border = `hsl(${getCSSVar('--border')})`;
    const rows = data.labels.map((label, index) => ({
      name: label,
      value: data.values[index],
      color: data.colors[index],
      itemStyle: { color: data.colors[index] },
      label: { show: Number(data.values[index]) > 0 },
      labelLine: { show: Number(data.values[index]) > 0 },
      emphasis: {
        itemStyle: {
          color: data.colors[index],
          opacity: 1,
          shadowBlur: 16,
          shadowColor: 'rgba(0,0,0,0.20)',
        },
      },
      blur: {
        itemStyle: {
          color: data.colors[index],
          opacity: 1,
        },
      },
    }));

    const itemTooltip = {
      trigger: 'item',
      backgroundColor: bg,
      borderColor: border,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: fg, fontSize: 12 },
      formatter: (params) => `
        <div style="min-width:110px">
          <div style="font-size:13px;color:${muted};margin-bottom:6px;">${data.label}</div>
          <div style="display:flex;align-items:center;gap:7px;">
            ${params.marker}
            <span style="color:${muted};">${params.name}</span>
            <strong style="margin-left:auto;color:${fg};">${params.value}</strong>
          </div>
        </div>
      `,
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.15); border-radius: 8px;',
    };
    const option = type === 'bar'
      ? {
          animation: true,
          tooltip: itemTooltip,
          grid: { left: '4%', right: '4%', top: '10%', bottom: '8%', containLabel: true },
          xAxis: {
            type: 'category',
            data: data.labels,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { color: muted, fontSize: 11 },
          },
          yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: muted, fontSize: 11 },
            splitLine: { lineStyle: { color: border, type: 'dashed' } },
          },
          series: [{
            name: data.label,
            type: 'bar',
            barWidth: '42%',
            data: rows.map((row) => ({
              ...row,
              itemStyle: { ...row.itemStyle, borderRadius: [7, 7, 0, 0] },
              emphasis: {
                itemStyle: {
                  color: row.color,
                  opacity: 1,
                  borderRadius: [7, 7, 0, 0],
                  shadowBlur: 12,
                  shadowColor: 'rgba(0,0,0,0.18)',
                },
              },
              blur: {
                itemStyle: {
                  color: row.color,
                  opacity: 1,
                  borderRadius: [7, 7, 0, 0],
                },
              },
            })),
            emphasis: {
              focus: 'self',
              blurScope: 'coordinateSystem',
              itemStyle: {
                shadowBlur: 12,
                shadowColor: 'rgba(0,0,0,0.18)',
              },
            },
            blur: { itemStyle: { opacity: 1 } },
          }],
        }
      : {
          animation: true,
          tooltip: itemTooltip,
          series: [{
            name: data.label,
            type: 'pie',
            radius: height <= 220 ? '54%' : '58%',
            center: ['50%', '52%'],
            minShowLabelAngle: 0,
            avoidLabelOverlap: true,
            label: {
              show: true,
              bleedMargin: 4,
              color: fg,
              fontSize: 12,
              fontWeight: 500,
              textBorderColor: bg,
              textBorderWidth: 2,
              textShadowBlur: 0,
              distanceToLabelLine: 6,
              formatter: ({ name, value }) => Number(value) > 0 ? name : '',
            },
            labelLine: {
              show: true,
              length: 14,
              length2: 28,
              maxSurfaceAngle: 80,
              lineStyle: { width: 1.2 },
            },
            labelLayout: { hideOverlap: true },
            itemStyle: { borderColor: 'transparent', borderWidth: 0 },
            emphasis: {
              focus: 'self',
              blurScope: 'series',
              scaleSize: 8,
              itemStyle: {
                shadowBlur: 16,
                shadowColor: 'rgba(0,0,0,0.18)',
              },
            },
            blur: {
              itemStyle: { opacity: 1 },
              label: { opacity: 1 },
              labelLine: { opacity: 1 },
            },
            data: rows,
          }],
        };

    chart.setOption(option, true);
  }, [data, type, themeVersion]);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeVersion((version) => version + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => chartRef.current?.resize());
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => chartRef.current?.dispose(), []);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
