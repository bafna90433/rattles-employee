import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdAccessTime, MdArrowForward, MdCheckCircle, MdNotificationsNone, MdOutlineCalendarToday, MdOutlineWarningAmber, MdPerson, MdStopCircle } from "react-icons/md";
import "../styles/EmployeeDashboard.css";

const n=(v:number)=>new Intl.NumberFormat("en-IN").format(v||0);
const EmployeeDashboard:React.FC=()=>{
 const nav=useNavigate(), username=localStorage.getItem("username")||"employee";
 const [loading,setLoading]=useState(true),[data,setData]=useState<any>({});
 const load=useCallback(async()=>{setLoading(true);const [raw,prod,packet,sales,rawStock,prodStock,packetStock]=await Promise.all([
  (window as any).electronAPI.getRawEntries?.(),(window as any).electronAPI.getProductionEntries?.(),(window as any).electronAPI.getPacketProductions?.(),(window as any).electronAPI.getPacketSales?.(),(window as any).electronAPI.getRawStock?.(),(window as any).electronAPI.getProductionStock?.(),(window as any).electronAPI.getPacketStock?.()
 ]);setData({raw:raw||[],prod:prod||[],packet:packet||[],sales:sales||[],rawStock:rawStock||[],prodStock:prodStock||[],packetStock:packetStock||[]});setLoading(false)},[]);
 useEffect(()=>{load()},[load]);
 const x=useMemo(()=>{const sum=(a:any[],f:string)=>a.reduce((s,i)=>s+Number(i[f]||0),0);const low=[...data.rawStock||[],...data.prodStock||[],...data.packetStock||[]].filter((i:any)=>i.total_qty<=10).slice(0,3);const jobs=[
 ...(data.prod||[]).map((i:any)=>({task:`Product Build - ${i.combo_name}`,type:"Production",ref:i.combo_name,by:i.entry_by,qty:i.qty,date:i.date,status:"Completed"})),
 ...(data.packet||[]).map((i:any)=>({task:`Packet Assembly - ${i.packet_code}`,type:"Assembly",ref:i.group_name,by:i.entry_by,qty:i.qty,date:i.date,status:"In Progress"})),
 ...(data.raw||[]).filter((i:any)=>i.quantity>0).map((i:any)=>({task:`Raw Material Entry - ${i.part_code}`,type:"Material",ref:i.color_code||i.part_code,by:i.entry_by,qty:i.quantity,date:i.entry_date,status:"Completed"})),
 ...(data.sales||[]).map((i:any)=>({task:`Packet Sale - ${i.packet_code}`,type:"Sales",ref:i.sold_to||"Customer",by:i.entry_by,qty:i.qty,date:i.date,status:"Completed"}))
 ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,4);
 return{raw:sum(data.rawStock||[],"total_qty"),products:sum(data.prod||[],"qty"),packets:sum(data.packetStock||[],"total_qty"),sales:sum(data.sales||[],"qty"),low,jobs}},[data]);
 if(loading)return <div className="floor-loading">Preparing production floor...</div>;
 const stations=[
  {num:1,title:"Materials",sub:"Raw Material Entry",img:"/assets/workflow/rattle-material.png",value:n(x.raw),unit:"parts in stock",status:"Live",button:"Start Entry",path:"/employee/raw-add",tone:"red"},
  {num:2,title:"Rattle Build",sub:"Product Production",img:"/assets/workflow/rattle-production.png",value:n(x.products),unit:"rattles produced",status:"Live",button:"Start Production",path:"/employee/production-list",tone:"gold"},
  {num:3,title:"Packet Assembly",sub:"Packet Production",img:"/assets/workflow/rattle-packing.png",value:n(x.packets),unit:"packets available",status:"Live",button:"Start Assembly",path:"/employee/packet-production",tone:"teal"},
  {num:4,title:"Dispatch / Sales",sub:"Packet Sale",img:"/assets/workflow/rattle-dispatch.png",value:n(x.sales),unit:"packets sold",status:"Ready",button:"Start Dispatch",path:"/employee/packet-sales",tone:"orange"}];
 return <div className="production-floor">
  <header className="floor-header"><div className="floor-brand"><span>BS</span><div><strong>Bafna Stock</strong><small>Rattle Toys Workspace</small></div></div><div className="floor-title"><h1>Production Floor</h1><p>Good day, {username}! Let's keep the toy line moving.</p></div><div className="floor-meta"><div><b>Shift A</b><small>08:00 AM - 04:00 PM</small></div><div><i/><span>Floor Status<small>Running Smooth</small></span></div><div><MdOutlineCalendarToday/><span>{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}<small><MdAccessTime/> {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</small></span></div></div></header>
  <main className="floor-body"><section className="workflow-area"><h2>Today's Rattle Toy Workflow</h2><div className="station-flow">{stations.map((s,i)=><React.Fragment key={s.title}><article className={`station-card ${s.tone}`}><div className="station-name"><b>{s.num}</b><div><h3>{s.title}</h3><small>{s.sub}</small></div></div><img src={s.img}/><div className="station-state"><span><i/> {s.status}</span><small>{i===0?"Materials ready":i===3?"Ready to dispatch":"Jobs active"}</small></div><div className="station-total"><small>Current Total</small><strong>{s.value} <em>{s.unit}</em></strong></div><button onClick={()=>nav(s.path)}>+ {s.button}</button></article>{i<3&&<div className="flow-arrow"><MdArrowForward/></div>}</React.Fragment>)}</div>
  <div className="floor-lower"><section className="floor-table"><div className="section-title"><h2>My Work Queue</h2><span>{x.jobs.length} Recent</span></div><div className="job-head"><span>Task</span><span>Type</span><span>Operator</span><span>Quantity</span><span>Status</span></div>{x.jobs.map((j:any,i:number)=><div className="job-row" key={i}><strong>{j.task}<small>{j.ref}</small></strong><span className={`tag ${j.type.toLowerCase()}`}>{j.type}</span><span>{j.by}</span><b>{n(j.qty)}</b><span className="job-status"><MdCheckCircle/> {j.status}</span></div>)}</section>
  <section className="alerts"><div className="section-title"><h2><MdNotificationsNone/> Floor Alerts</h2><span>{x.low.length} Alerts</span></div>{x.low.length?x.low.map((a:any,i:number)=><div className="alert-row" key={i}><MdOutlineWarningAmber/><div><strong>{a.part_code||a.combo_name||a.packet_code}</strong><small>Only {n(a.total_qty)} remaining</small></div><b>{a.total_qty<=0?"Critical":"Low Stock"}</b><MdArrowForward/></div>):<div className="no-alert"><MdCheckCircle/> All stock levels are healthy.</div>}</section></div></section>
  <aside className="floor-right"><section className="operator-card"><h2>Operator</h2><div className="operator-main"><div className="operator-avatar"><MdPerson/></div><div><strong>{username}</strong><small>Production Operator</small><span><i/> On Floor</span></div></div><dl><dt>Workstation</dt><dd>Rattle Assembly Line</dd><dt>Current Job</dt><dd>Daily Toy Production</dd></dl><button><MdStopCircle/> End Shift</button></section><section className="shift-card"><h2><MdAccessTime/> Shift Summary</h2><p>Live production totals</p>{stations.map(s=><div key={s.title}><span>{s.sub}</span><strong>{s.value}</strong></div>)}</section></aside></main>
 </div>
};
export default EmployeeDashboard;
