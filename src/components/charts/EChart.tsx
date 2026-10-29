import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts';
import { GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([BarChart, LineChart, PieChart, ScatterChart, GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent, CanvasRenderer]);

export type Option = echarts.EChartsCoreOption;

export function EChart({ option, height = 320, onClick }: { option: Option; height?: number; onClick?: (p: { name?: string; dataIndex: number; data: unknown }) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;

  useEffect(() => {
    if (!el.current) return;
    const c = echarts.init(el.current, null, { renderer: 'canvas' });
    chart.current = c;
    c.on('click', (p) => clickRef.current?.(p as never));
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      c.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, { replaceMerge: ['series'], lazyUpdate: true });
  }, [option]);

  useEffect(() => {
    chart.current?.resize();
  }, [height]);

  return <div ref={el} style={{ height }} className="w-full" />;
}

// Açık / koyu temaya göre eksen, ipucu ve yazı renkleri
export function chartTheme(theme: 'dark' | 'light') {
  const light = theme === 'light';
  const muted = light ? '#475569' : '#94a3b8';
  return {
    text: light ? '#1e293b' : '#cbd5e1',
    muted,
    dimmed: light ? '#94a3b8' : '#475569',
    oomBar: light ? '#cbd5e1' : '#334155',
    highlight: light ? '#b45309' : '#fbbf24',
    AXIS: {
      axisLine: { lineStyle: { color: light ? 'rgba(15,23,42,.2)' : 'rgba(148,163,184,.25)' } },
      axisLabel: { color: muted, fontFamily: 'JetBrains Mono Variable, monospace', fontSize: 10 },
      splitLine: { lineStyle: { color: light ? 'rgba(15,23,42,.07)' : 'rgba(148,163,184,.08)' } },
      nameTextStyle: { color: muted, fontSize: 11 },
    },
    TOOLTIP: {
      backgroundColor: light ? 'rgba(255,255,255,.97)' : 'rgba(10,14,26,.95)',
      borderColor: light ? 'rgba(15,23,42,.12)' : 'rgba(148,163,184,.2)',
      textStyle: { color: light ? '#0f172a' : '#e2e8f0', fontSize: 12 },
      extraCssText: `border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,${light ? '.12' : '.5'});backdrop-filter:blur(8px);`,
    },
  };
}

export const grad = (a: string, b: string, vertical = true) =>
  new echarts.graphic.LinearGradient(0, 0, vertical ? 0 : 1, vertical ? 1 : 0, [
    { offset: 0, color: a },
    { offset: 1, color: b },
  ]);
