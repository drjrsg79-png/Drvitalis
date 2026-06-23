'use client';
import { useState, useEffect, useRef } from "react";

const T = {
  cream:"#FAF8F5", ivory:"#F3F0EB", gold:"#B8922A", charcoal:"#1C1C1E", 
  ink:"#2E2E30", muted:"#7A7670", subtle:"#A8A39C", white:"#FFFFFF",
  teal:"#2D7D6F", border:"#DDD8CE", danger:"#C0392B"
};

const css = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Jost:wght@400;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}html,body{font-family:'Jost',sans-serif;background:${T.cream};color:${T.ink}}
button{cursor:pointer;transition:opacity .2s}button:hover{opacity:.8}input,select{outline:none}`;

const IMG = {
  hero:"https://images.unsplash.com/photo-1629909615184-74f495363b67?w=900&q=80",
  doctor:"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80",
  clinic:"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&q=80"
};

const Btn = ({children,onClick,style={},disabled=false}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:"12px 24px",borderRadius:3,
    background:T.gold,color:T.white,border:"none",fontSize:12,fontWeight:600,
    fontFamily:"'Jost',sans-serif",opacity:disabled?.5:1,...style}}>
    {children}
  </button>
);

const Label = ({children}) => <div style={{fontSize:10,fontWeight:600,color:T.muted,marginBottom:6,
  letterSpacing:"0.1em",textTransform:"uppercase"}}>{children}</div>;

const Field = ({label,value,onChange,placeholder,options}) => (
  <div style={{marginBottom:18}}>
    <Label>{label}</Label>
    {options?(
      <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"10px 14px",
        background:T.white,border:`1px solid ${T.border}`,borderRadius:3,fontSize:13,fontFamily:"'Jost',sans-serif"}}>
        <option value="">Seleccionar</option>
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    ):(
      <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"10px 14px",background:T.white,border:`1px solid ${T.border}`,
          borderRadius:3,fontSize:13,fontFamily:"'Jost',sans-serif"}}/>
    )}
  </div>
);

const Landing = ({onStart}) => (
  <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",
    justifyContent:"center",padding:"20px",textAlign:"center"}}>
    <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:42,color:T.charcoal,marginBottom:20}}>VITALIS</h1>
    <p style={{fontSize:16,color:T.muted,marginBottom:40,maxWidth:500,lineHeight:1.6}}>
      Tu urólogo experto en salud sexual masculina, disponible 24/7. Protocolos personalizados, medicamentos con dosis exactas y ejercicios terapéuticos.
    </p>
    <Btn onClick={onStart}>Comenzar ahora</Btn>
  </div>
);

const Onboarding = ({onComplete}) => {
  const [step,setStep] = useState(0);
  const [form,setForm] = useState({nombre:"",edad:"",pais:"",condicion:"",
    tiempo:"",objetivo:"",medicamentos:"",alergias:"",presion:"",diabetes:"",cardio:""});
  
  const PAISES = ["México","España","Argentina","Colombia","Chile"];
  const CONDICIONES = ["Disfunción Eréctil","Eyaculación Precoz","Testosterona Baja"];
  
  const steps = [
    {title:"Datos personales",fields:[
      {k:"nombre",l:"Nombre completo",p:"Ej: Rogelio"},
      {k:"edad",l:"Edad",p:"Ej: 44"},
      {k:"pais",l:"País",o:PAISES}
    ]},
    {title:"Tu condición",fields:[
      {k:"condicion",l:"¿Cuál es tu principal preocupación?",o:CONDICIONES},
      {k:"tiempo",l:"Desde hace cuánto tiempo",p:"Ej: 8 meses"},
      {k:"objetivo",l:"¿Cuál es tu objetivo?",p:"Ej: Recuperar erección firme"}
    ]},
    {title:"Historial médico",fields:[
      {k:"medicamentos",l:"Medicamentos actuales",p:"Ej: Enalapril 10mg"},
      {k:"alergias",l:"Alergias conocidas",p:"Ej: Ninguna"},
      {k:"presion",l:"¿Tienes hipertensión?",o:["No","Sí"]},
      {k:"diabetes",l:"¿Tienes diabetes?",o:["No","Sí"]},
      {k:"cardio",l:"¿Problemas cardíacos?",o:["No","Sí"]}
    ]}
  ];
  
  const curr = steps[step];
  const allFilled = curr.fields.every(f=>form[f.k]);
  
  return (
    <div style={{minHeight:"100vh",background:T.cream,padding:"20px",maxWidth:500,margin:"0 auto"}}>
      <div style={{marginBottom:30}}>
        <div style={{fontSize:12,color:T.muted,marginBottom:10}}>PASO {step+1} DE {steps.length}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.charcoal}}>{curr.title}</h2>
      </div>
      
      {curr.fields.map(f=>(
        <Field key={f.k} label={f.l} value={form[f.k]} onChange={v=>setForm({...form,[f.k]:v})}
          placeholder={f.p} options={f.o}/>
      ))}
      
      <div style={{display:"flex",gap:10,marginTop:30}}>
        {step>0&&<Btn onClick={()=>setStep(step-1)}>Atrás</Btn>}
        {step<steps.length-1?(
          <Btn onClick={()=>setStep(step+1)} disabled={!allFilled}>Siguiente</Btn>
        ):(
          <Btn onClick={()=>onComplete(form)} disabled={!allFilled}>Confirmar</Btn>
        )}
      </div>
    </div>
  );
};

const ChatView = ({perfil}) => {
  const [msgs,setMsgs] = useState([{role:"assistant",content:`Buenas tardes, ${perfil.nombre}. Soy el Dr. Vitalis. He revisado su perfil. ¿En qué puedo ayudarle?`}]);
  const [input,setInput] = useState("");
  const [loading,setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  
  const send = async (text) => {
    if(!text.trim()||loading)return;
    const newMsgs = [...msgs,{role:"user",content:text}];
    setMsgs(newMsgs);setInput("");setLoading(true);
    try{
      const res = await fetch("/api/vitalis",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({systemPrompt:`Eres el Dr. Vitalis, urólogo especialista. Paciente: ${perfil.nombre}, ${perfil.edad} años, ${perfil.pais}. Condición: ${perfil.condicion}. Responde en español, sin emojis, tono profesional.`,
          messages:newMsgs})});
      const data = await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:data.reply||"Error."}]);
    }catch{
      setMsgs(p=>[...p,{role:"assistant",content:"Error de conexión."}]);
    }
    setLoading(false);
  };
  
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.cream}}>
      <div style={{padding:"15px 20px",background:T.white,borderBottom:`1px solid ${T.border}`,fontSize:14,fontWeight:600}}>
        Dr. Vitalis — Disponible ahora
      </div>
      
      <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:m.role==="user"?"12px 3px 12px 12px":"3px 12px 12px 12px",
              background:m.role==="user"?T.charcoal:T.white,color:m.role==="user"?T.white:T.ink,
              fontSize:13,lineHeight:1.6,border:m.role==="assistant"?`1px solid ${T.border}`:"none"}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&<div style={{fontSize:12,color:T.muted}}>Dr. Vitalis está escribiendo...</div>}
        <div ref={endRef}/>
      </div>
      
      <div style={{padding:"15px",borderTop:`1px solid ${T.border}`,background:T.white,display:"flex",gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Escribe tu consulta..."
          onKeyDown={e=>{if(e.key==="Enter")send(input)}}
          style={{flex:1,padding:"10px 12px",background:T.cream,border:`1px solid ${T.border}`,
            borderRadius:3,fontSize:13,fontFamily:"'Jost',sans-serif"}}/>
        <button onClick={()=>send(input)} disabled={!input.trim()||loading}
          style={{padding:"10px 16px",background:input.trim()&&!loading?T.gold:T.border,
            color:T.white,border:"none",borderRadius:3,cursor:input.trim()&&!loading?"pointer":"not-allowed",
            fontSize:11,fontWeight:600,fontFamily:"'Jost',sans-serif"}}>
          Enviar
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [screen,setScreen] = useState("landing");
  const [perfil,setPerfil] = useState({});
  
  useEffect(()=>{
    if(typeof window!=="undefined"){
      const params = new URLSearchParams(window.location.search);
      if(params.get("success")==="true"){
        setScreen("onboarding");
        window.history.replaceState({},"",,window.location.pathname);
      }
    }
  },[]);
  
  return(
    <>
      <style>{css}</style>
      {screen==="landing"&&<Landing onStart={()=>setScreen("onboarding")}/>}
      {screen==="onboarding"&&<Onboarding onComplete={d=>{setPerfil(d);setScreen("chat");}}/>}
      {screen==="chat"&&<ChatView perfil={perfil}/>}
    </>
  );
}
