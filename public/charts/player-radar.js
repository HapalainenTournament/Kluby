import React from 'https://esm.sh/react@18.3.1';
import {createRoot} from 'https://esm.sh/react-dom@18.3.1/client';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'https://esm.sh/recharts@3.10.1?deps=react@18.3.1,react-dom@18.3.1';
import {CLUBROOM_CHART_THEME,ClubroomChartFrame,ClubroomChartTooltip} from './chart-theme.js';

const roots=new WeakMap();
const h=React.createElement;

function RadarView({data}){
  const t=CLUBROOM_CHART_THEME;
  return h(ClubroomChartFrame,{className:'playerRadarRecharts69'},
    h(ResponsiveContainer,{width:'100%',height:'100%'},
      h(RadarChart,{data,outerRadius:'72%',margin:{top:18,right:26,bottom:18,left:26}},
        h(PolarGrid,{stroke:t.colors.grid}),
        h(PolarAngleAxis,{dataKey:'axis',tick:{fill:t.colors.text,fontFamily:t.fontFamily,fontSize:12,fontWeight:800}}),
        h(PolarRadiusAxis,{angle:90,domain:[0,100],tick:false,axisLine:false}),
        h(Radar,{name:'Squad average',dataKey:'team',stroke:t.colors.team,fill:'transparent',strokeWidth:1.25,isAnimationActive:false}),
        h(Radar,{name:'Player',dataKey:'player',stroke:t.colors.accent,fill:t.colors.accent,fillOpacity:.22,strokeWidth:2.2,isAnimationActive:false}),
        h(Tooltip,{content:h(ClubroomChartTooltip),cursor:false})
      )
    )
  );
}

export function renderPlayerRadar(host,data){
  if(!host)return;
  let root=roots.get(host);if(!root){root=createRoot(host);roots.set(host,root)}
  root.render(h(RadarView,{data:Array.isArray(data)?data:[]}));
}

export function unmountPlayerRadar(host){const root=host&&roots.get(host);if(root){root.unmount();roots.delete(host)}}

export function standaloneRadarSvg(host){
  const svg=host?.querySelector('svg');if(!svg)return null;
  const clone=svg.cloneNode(true),box=svg.getBoundingClientRect();
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  clone.setAttribute('width',String(Math.max(1,Math.round(box.width||svg.clientWidth||640))));
  clone.setAttribute('height',String(Math.max(1,Math.round(box.height||svg.clientHeight||420))));
  return new XMLSerializer().serializeToString(clone);
}

window.ClubroomCharts={...(window.ClubroomCharts||{}),renderPlayerRadar,unmountPlayerRadar,standaloneRadarSvg,theme:CLUBROOM_CHART_THEME};
window.dispatchEvent(new CustomEvent('clubroom-charts-ready'));
