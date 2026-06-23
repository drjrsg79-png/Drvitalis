'use client';
import { useState, useRef, useEffect } from "react";

const T = { cream:"#FAF8F5", charcoal:"#1C1C1E", gold:"#B8922A", white:"#FFFFFF", ink:"#2E2E30", border:"#DDD8CE", muted:"#7A7670", teal:"#2D7D6F" };

const Landing = ({onStart}) => (
  <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px",background:T.cream}}>
    <h1 style={{fontSize:"48px",fontWeight:"bold",color:T.charcoal,marginBottom:"30px"}}>VITALIS</h1>
    <p style={{fontSize:"16px",color:T.muted,marginBottom:"40px",textAlign:"center",maxWidth:"500px"}}>Tu urólogo experto en salud sexual masculina, disponible 24/7</p>
    <button onClick={onStart} style={{padding:"12px 32px",background:T.gold,color:T.white,border:"none",borderRadius:"4px",fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>Comenzar</button>
  </div>
);

const Onboarding = ({onComplete}) => {
  const [form,setForm] = useState({nombre:"",edad:"",pais:"",condicion:""});
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px",background:T.cream}}>
      <h2 style={{fontSize:"28px",fontWeight:"bold",color:T.charcoal,marginBottom:"40px"}}>Información Personal</h2>
      <div style={{maxWidth:"400px",width:"100%"}}>
        <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} style={{width:"100%",padding:"10px",marginBottom:"15px",border:`1px solid ${T.border}`,borderRadius:"4px"}}/>
        <input placeholder="Edad" value={form.edad} onChange={e=>setForm({...form,edad:e.target.value})} style={{width:"100%",padding:"10px",marginBottom:"15px",border:`1px solid ${T.border}`,borderRadius:"4px"}}/>
        <input placeholder="País" value={form.pais} onChange={e=>setForm({...form,pais:e.target.value})} style={{width:"100%",padding:"10px",marginBottom:"15px",border:`1px solid ${T.border}`,borderRadius:"4px"}}/>
        <input placeholder="Condición médica" value={form.condicion} onChange={e=>setForm({...form,condicion:e.target.value})} style={{width:"100%",padding:"10px",marginBottom:"20px",border:`1px solid ${T.border}`,borderRadius:"4px"}}/>
        <button onClick={()=>onComplete(form)} style={{width:"100%",padding:"12px",background:T.gold,color:T.white,border:"none",borderRadius:"4px",cursor:"pointer",fontSize:"14px",fontWeight:"600"}}>Continuar</button>
      </div>
    </div>
  );
};

const ChatView = ({perfil}) => {
  const [msgs,setMsgs] = useState([{role:"assistant",content:`Buenas tardes, ${perfil.nombre}. Soy el Dr. Vitalis. ¿En qué puedo ayudarle?`}]);
  const [input,setInput] = useState("");
  const [loading,setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  
  const send = async (text) => {
    if(!text.trim()||loading)return;
    const newMsgs = [...msgs,{role:"user",content:text}];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try{
      const res = await fetch("/api/vitalis",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemPrompt:`Eres Dr. Vitalis, urólogo especialista. Paciente: ${perfil.nombre}, ${perfil.edad} años, ${perfil.pais}. Condición: ${perfil.condicion}. Responde en español, sin emojis.`,messages:newMsgs})});
      const data = await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:data.reply||"Error"}]);
    }catch{
      setMsgs(p=>[...p,{role:"assistant",content:"Error de conexión"}]);
    }
    setLoading(false);
  };
  
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.cream}}>
      <div style={{padding:"15px",background:T.white,borderBottom:`1px solid ${T.border}`,fontSize:"14px",fontWeight:"600"}}>Dr. Vitalis</div>
      <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:"10px"}}>
        {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}><div style={{maxWidth:"80%",padding:"10px 15px",borderRadius:"8px",background:m.role==="user"?T.charcoal:T.white,color:m.role==="user"?T.white:T.ink,fontSize:"13px",border:m.role==="assistant"?`1px solid ${T.border}`:"none"}}>{m.content}</div></div>)}
        {loading&&<div style={{color:T.muted,fontSize:"12px"}}>Escribiendo...</div>}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"15px",borderTop:`1px solid ${T.border}`,display:"flex",gap:"10px"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Tu consulta..." onKeyDown={e=>{if(e.key==="Enter")send(input);}} style={{flex:1,padding:"10px",border:`1px solid ${T.border}`,borderRadius:"4px",fontSize:"13px"}}/>
        <button onClick={()=>send(input)} style={{padding:"10px 16px",background:T.gold,color:T.white,border:"none",borderRadius:"4px",cursor:"pointer",fontWeight:"600"}}>Enviar</button>
      </div>
    </div>
  );
};

export default function App(){
  const [screen,setScreen] = useState("landing");
  const [perfil,setPerfil] = useState({});
  return(
    <>
      {screen==="landing"&&<Landing onStart={()=>setScreen("onboarding")}/>}
      {screen==="onboarding"&&<Onboarding onComplete={d=>{setPerfil(d);setScreen("chat");}}/>}
      {screen==="chat"&&<ChatView perfil={perfil}/>}
    </>
  );
}
