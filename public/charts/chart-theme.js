import React from 'https://esm.sh/react@18.3.1';

export const CLUBROOM_CHART_THEME = Object.freeze({
  colors:{
    accent:'#2DD4BF',
    accentFill:'rgba(45,212,191,.22)',
    team:'rgba(148,163,184,.82)',
    grid:'rgba(148,163,184,.18)',
    text:'#F8FAFC',
    muted:'#8FA1B8',
    panel:'#0F1A2B',
    border:'rgba(255,255,255,.08)'
  },
  fontFamily:'Inter, Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
});

export function ClubroomChartFrame({children,className=''}){
  return React.createElement('div',{className:`clubroomChartFrame69 ${className}`.trim()},children);
}

export function ClubroomChartTooltip({active,payload}){
  if(!active||!payload?.length)return null;
  const d=payload[0]?.payload||{};
  return React.createElement('div',{className:'clubroomChartTooltip69'},
    React.createElement('b',null,d.axis||'Metric'),
    React.createElement('strong',null,`${Math.round(Number(d.player)||0)}th percentile`),
    d.valueLabel?React.createElement('span',null,d.valueLabel):null,
    d.rankLabel?React.createElement('span',null,d.rankLabel):null,
    d.breakdown?.length?React.createElement('small',null,d.breakdown.join(' · ')):null
  );
}
