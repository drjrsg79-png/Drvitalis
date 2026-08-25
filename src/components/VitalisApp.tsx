'use client';
import { useState, useRef, useEffect } from "react";

const T = { cream:"#FAF8F5", charcoal:"#1C1C1E", gold:"#B8922A", white:"#FFFFFF", ink:"#2E2E30", border:"#DDD8CE", muted:"#7A7670", teal:"#2D7D6F" };

const Landing = ({onStart}) => (
  <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px",background:T.cream,textAlign:"center"}}>
    <h1 style={{fontSize:"48px",fontWeight:"bold",color:T.charcoal,marginBottom:"20px"}}>VITALIS</h1>
    <p style={{fontSize:"16px",color:T.muted,marginBottom:"30px",maxWidth:"600px",lineHeight:"1.6"}}>
      Tu internista experto en salud sexual masculina, disponible 24/7. Protocolos personalizados, medicamentos con dosis exactas y conversaciones privadas.
    </p>
    <div style={{marginBottom:"30px"}}>
      <h3 style={{fontSize:"18px",color:T.charcoal,marginBottom:"15px"}}>Qué hace Vitalis</h3>
      <div style={{maxWidth:"500px",margin:"0 auto",textAlign:"left"}}>
        <p style={{marginBottom:"10px",fontSize:"14px",color:T.ink}}>✓ Conversaciones 24/7 con el Dr. Rogelio</p>
        <p style={{marginBottom:"10px",fontSize:"14px",color:T.ink}}>✓ Protocolo personalizado para tu condición</p>
        <p style={{marginBottom:"10px",fontSize:"14px",color:T.ink}}>✓ Medicamentos con dosis exactas para tu país</p>
        <p style={{fontSize:"14px",color:T.ink}}>✓ Privacidad total, sin salas de espera</p>
      </div>
    </div>
    <button onClick={onStart} style={{padding:"14px 40px",background:T.gold,color:T.white,border:"none",borderRadius:"4px",fontSize:"16px",fontWeight:"600",cursor:"pointer",marginBottom:"20px"}}>Comenzar ahora</button>
    <p style={{fontSize:"13px",color:T.muted}}>Suscripción $599 MXN al mes. Cancela cuando quieras.</p>
  </div>
);

const Onboarding = ({onComplete}) => {
  const [step,setStep] = useState(0);
  const [form,setForm] = useState({nombre:"",email:"",edad:"",pais:"",condicion:""});
  
  const PAISES = ["México","España","Argentina","Colombia","Chile"];
  const CONDICIONES = ["Disfunción Eréctil","Eyaculación Precoz","Testosterona Baja","Otra"];
  
  const steps = [
    {title:"Datos personales",fields:[
      {k:"nombre",l:"Nombre completo",p:"Ej: Rogelio"},
      {k:"email",l:"Correo electrónico",p:"Ej: rogelio@mail.com"},
      {k:"edad",l:"Edad",p:"Ej: 44"},
    ]},
    {title:"Ubicación y condición",fields:[
      {k:"pais",l:"País",o:PAISES},
      {k:"condicion",l:"¿Cuál es tu condición?",o:CONDICIONES},
    ]}
  ];
  
  const curr = steps[step];
  const allFilled = curr.fields.every(f=>form[f.k]);
  
  return (
    <div style={{minHeight:"100vh",background:T.cream,padding:"20px",maxWidth:"500px",margin:"0 auto"}}>
      <div style={{marginBottom:30}}>
        <div style={{fontSize:12,color:T.muted,marginBottom:10}}>PASO {step+1} DE {steps.length}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:T.charcoal}}>{curr.title}</h2>
      </div>
      
      {curr.fields.map(f=>(
        <div key={f.k} style={{marginBottom:18}}>
          <label style={{fontSize:10,fontWeight:600,color:T.muted,marginBottom:6,display:"block",letterSpacing:"0.1em",textTransform:"uppercase"}}>
            {f.l}
          </label>
          {f.o?(
            <select value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} 
              style={{width:"100%",padding:"10px 14px",background:T.white,border:`1px solid ${T.border}`,borderRadius:3,fontSize:13}}>
              <option value="">Seleccionar</option>
              {f.o.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          ):(
            <input type="text" value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.p}
              style={{width:"100%",padding:"10px 14px",background:T.white,border:`1px solid ${T.border}`,borderRadius:3,fontSize:13}}/>
          )}
        </div>
      ))}
      
      <div style={{display:"flex",gap:10,marginTop:30}}>
        {step>0&&<button onClick={()=>setStep(step-1)} style={{padding:"12px 24px",background:T.white,color:T.gold,border:`1px solid ${T.gold}`,borderRadius:3,cursor:"pointer",fontWeight:600,fontSize:12}}>Atrás</button>}
        {step<steps.length-1?(
          <button onClick={()=>setStep(step+1)} disabled={!allFilled} style={{padding:"12px 24px",background:allFilled?T.gold:T.border,color:T.white,border:"none",borderRadius:3,cursor:allFilled?"pointer":"not-allowed",fontWeight:600,fontSize:12,opacity:allFilled?1:0.5}}>Siguiente</button>
        ):(
          <button onClick={()=>onComplete(form)} disabled={!allFilled} style={{padding:"12px 24px",background:allFilled?T.gold:T.border,color:T.white,border:"none",borderRadius:3,cursor:allFilled?"pointer":"not-allowed",fontWeight:600,fontSize:12,opacity:allFilled?1:0.5}}>Ir a pago</button>
        )}
      </div>
    </div>
  );
};

const ChatView = ({perfil,onGoToPayment}) => {
  const [msgs,setMsgs] = useState([{role:"assistant",content:`Buenas tardes, ${perfil.nombre}. Soy el Dr. Rogelio, internista y diplomado en andrología. ¿En qué puedo ayudarle?`}]);
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
        body:JSON.stringify({systemPrompt:`Eres el Dr. Rogelio, internista y diplomado en andrología, especialista en salud sexual masculina.\n\nPaciente: ${perfil.nombre}, ${perfil.edad} años, ${perfil.pais}. Condición: ${perfil.condicion}.\n\nIMPORTANTE: Si el paciente pregunta "¿con quién debo ir?", "¿a quién consulto?" o preguntas similares sobre referencia médica, SIEMPRE responde:\n\n"Puede contactarme directamente. Soy el Dr. Rogelio, internista y diplomado en andrología. Mi teléfono es: 55 6932 0331"\n\nMantén tono profesional, sin emojis, en español. Máximo 150 palabras.`,
          messages:newMsgs})});
      const data = await res.json();
      setMsgs(p=>[...p,{role:"assistant",content:data.reply||"Error"}]);
    }catch{
      setMsgs(p=>[...p,{role:"assistant",content:"Error de conexión"}]);
    }
    setLoading(false);
  };
  
  if(msgs.length>4){
    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px",background:T.cream,textAlign:"center"}}>
        <h2 style={{fontSize:"24px",color:T.charcoal,marginBottom:"20px"}}>Conversación completada</h2>
        <p style={{fontSize:"14px",color:T.muted,marginBottom:"30px",maxWidth:"400px"}}>
          Para acceder a consultas ilimitadas con el Dr. Rogelio, completa tu suscripción.
        </p>
        <button onClick={onGoToPayment} style={{padding:"12px 32px",background:T.gold,color:T.white,border:"none",borderRadius:"4px",fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
          Ir a pago
        </button>
      </div>
    );
  }
  
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:T.cream}}>
      <div style={{padding:"15px 20px",background:T.white,borderBottom:`1px solid ${T.border}`,fontSize:"14px",fontWeight:"600"}}>
        Dr. Rogelio — Disponible ahora
      </div>
      
      <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:"10px"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:m.role==="user"?"12px 3px 12px 12px":"3px 12px 12px 12px",
              background:m.role==="user"?T.charcoal:T.white,color:m.role==="user"?T.white:T.ink,
              fontSize:"13px",lineHeight:"1.6",border:m.role==="assistant"?`1px solid ${T.border}`:"none"}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&<div style={{fontSize:"12px",color:T.muted}}>Dr. Rogelio está escribiendo...</div>}
        <div ref={endRef}/>
      </div>
      
      <div style={{padding:"15px",borderTop:`1px solid ${T.border}`,background:T.white,display:"flex",gap:"10px"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Tu consulta..."
          onKeyDown={e=>{if(e.key==="Enter")send(input);}}
          style={{flex:1,padding:"10px 12px",background:T.cream,border:`1px solid ${T.border}`,borderRadius:3,fontSize:13}}/>
        <button onClick={()=>send(input)} disabled={!input.trim()||loading}
          style={{padding:"10px 16px",background:input.trim()&&!loading?T.gold:T.border,color:T.white,border:"none",borderRadius:3,cursor:input.trim()&&!loading?"pointer":"not-allowed",fontSize:11,fontWeight:600}}>
          Enviar
        </button>
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
      {screen==="chat"&&<ChatView perfil={perfil} onGoToPayment={()=>{window.location.href="/api/stripe/checkout?email="+encodeURIComponent(perfil.email)}}/>}
    </>
  );
                                                                               }
