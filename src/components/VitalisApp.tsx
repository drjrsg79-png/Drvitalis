'use client';
import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════ */
const T = {
  cream:"#FAF8F5", ivory:"#F3F0EB", ivoryMid:"#EAE5DC", border:"#DDD8CE",
  gold:"#B8922A", goldDark:"#9A7720", goldFaint:"rgba(184,146,42,0.09)", goldLine:"rgba(184,146,42,0.24)",
  charcoal:"#1C1C1E", ink:"#2E2E30", muted:"#7A7670", subtle:"#A8A39C", white:"#FFFFFF",
  teal:"#2D7D6F", tealFaint:"rgba(45,125,111,0.09)", tealLine:"rgba(45,125,111,0.28)",
  danger:"#C0392B", dangerFaint:"rgba(192,57,43,0.07)",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Jost:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:'Jost',sans-serif;background:${T.cream};color:${T.ink};-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:${T.ivory}}::-webkit-scrollbar-thumb{background:${T.border}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .fu{animation:fadeUp .4s ease forwards}
  input,select,textarea{outline:none;appearance:none;-webkit-appearance:none}
  button{transition:opacity .18s}button:hover{opacity:.82}
  iframe{border:none}
`;

const IMG = {
  hero:    "https://images.unsplash.com/photo-1629909615184-74f495363b67?w=900&q=80&auto=format",
  doctor:  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&auto=format",
  clinic:  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&q=80&auto=format",
  sport:   "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80&auto=format",
  pills:   "https://images.unsplash.com/photo-1550572017-edd951b55104?w=600&q=80&auto=format",
  calendar:"https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80&auto=format",
  stripe:  "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=80&auto=format",
};

const ImgWithFallback = ({src,alt,style={},seed="med"}) => {
  const [err,setErr] = useState(false);
  return err
    ? <div style={{...style,background:`linear-gradient(135deg,${T.ivory},${T.ivoryMid})`,
        display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill={T.border}/>
          <path d="M20 10v20M10 20h20" stroke={T.subtle} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    : <img src={src} alt={alt} style={style} onError={()=>setErr(true)}/>;
};

const MEDICINES = {
  sildenafil:{
    color:"#1565C0", lightColor:"#E3F2FD", shape:"round",
    img:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80&auto=format",
    desc:"Inhibidor PDE-5 de acción rápida"
  },
  tadalafil:{
    color:"#FFB300", lightColor:"#FFF8E1", shape:"almond",
    img:"https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&q=80&auto=format",
    desc:"Inhibidor PDE-5 de larga duración"
  },
  dapoxetina:{
    color:"#C2185B", lightColor:"#FCE4EC", shape:"round",
    img:"https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&q=80&auto=format",
    desc:"ISRS de acción corta para EP"
  },
  testosterona:{
    color:"#2E7D32", lightColor:"#E8F5E9", shape:"tube",
    img:"https://images.unsplash.com/photo-1596493636557-95a47c4b5082?w=300&q=80&auto=format",
    desc:"Terapia hormonal sustitutiva"
  },
  emla:{
    color:"#4527A0", lightColor:"#EDE7F6", shape:"tube",
    img:"https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?w=300&q=80&auto=format",
    desc:"Anestésico tópico local"
  },
  zinc:{
    color:"#00838F", lightColor:"#E0F7FA", shape:"capsule",
    img:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=300&q=80&auto=format",
    desc:"Suplemento mineral esencial"
  },
};

const VIDEOS = {
  kegel:       { id:"VBlM5mVMiYs", titulo:"Ejercicios de Kegel masculinos", canal:"Men's Health" },
  startStop:   { id:"nAqkjxNEIMU", titulo:"Técnica Start-Stop para control eyaculatorio", canal:"Sexual Medicine" },
  aerobico:    { id:"blHt3c3FQGA", titulo:"Marcha aeróbica para salud sexual", canal:"Cardio Health" },
  sentadilla:  { id:"YaXPRqUwItQ", titulo:"Sentadilla correcta para testosterona", canal:"Strength Training" },
  fuerzaComp:  { id:"IODxDxX7oi4", titulo:"Entrenamiento compuesto de fuerza", canal:"Performance Training" },
  kegInverso:  { id:"0vD6YFR72pQ", titulo:"Kegel inverso — control pélvico", canal:"Pelvic Health" },
  compresion:  { id:"Kq-gAnBzz5E", titulo:"Técnica de compresión (Masters & Johnson)", canal:"Sexual Therapy" },
};

const Rule = ({style={}}) => <div style={{height:1,background:T.border,...style}}/>;
const Label = ({children,style={}}) => (
  <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",
    color:T.muted,marginBottom:6,...style}}>{children}</div>
);
const Chip = ({text,color=T.gold,style={}}) => (
  <span style={{display:"inline-block",padding:"3px 10px",borderRadius:2,fontSize:10,
    fontWeight:600,letterSpacing:"0.07em",textTransform:"uppercase",
    background:`${color}14`,color,border:`1px solid ${color}32`,...style}}>{text}</span>
);
const Btn = ({children,onClick,variant="gold",style={},disabled=false}) => {
  const v={
    gold:{background:T.gold,color:T.white,border:"none"},
    outline:{background:"transparent",color:T.gold,border:`1.5px solid ${T.gold}`},
    dark:{background:T.charcoal,color:T.white,border:"none"},
    teal:{background:T.teal,color:T.white,border:"none"},
    subtle:{background:T.ivory,color:T.muted,border:`1px solid ${T.border}`},
    ghost:{background:T.goldFaint,color:T.goldDark,border:`1px solid ${T.goldLine}`},
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:"11px 24px",borderRadius:3,cursor:disabled?"not-allowed":"pointer",
        fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:600,letterSpacing:"0.09em",
        textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:8,
        opacity:disabled?.5:1,...v[variant],...style}}>
      {children}
    </button>
  );
};

const FieldInput = ({label,type="text",value,onChange,placeholder,options}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  options?: string[];
}) => (
  <div style={{marginBottom:18}}>
    <Label>{label}</Label>
    {options ? (
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"10px 14px",background:T.white,border:`1px solid ${T.border}`,
          borderRadius:3,color:value?T.ink:T.subtle,fontSize:14,fontFamily:"'Jost',sans-serif"}}>
        <option value="">Seleccionar</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ):(
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{width:"100%",padding:"10px 14px",background:T.white,border:`1px solid ${T.border}`,
          borderRadius:3,color:T.ink,fontSize:14,fontFamily:"'Jost',sans-serif"}}/>
    )}
  </div>
);

const VideoCard = ({videoKey,style={}}) => {
  const [open,setOpen] = useState(false);
  const v = VIDEOS[videoKey];
  if (!v) return null;
  return (
    <div style={{...style}}>
      {!open ? (
        <div onClick={()=>setOpen(true)} style={{cursor:"pointer",position:"relative",
          background:T.charcoal,borderRadius:6,overflow:"hidden",aspectRatio:"16/9",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <ImgWithFallback
            src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
            alt={v.titulo}
            style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.7,position:"absolute",inset:0}}/>
          <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",
            alignItems:"center",gap:8}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"rgba(255,255,255,.92)",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:0,height:0,borderTop:"9px solid transparent",
                borderBottom:"9px solid transparent",borderLeft:`16px solid ${T.charcoal}`,
                marginLeft:4}}/>
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.85)",fontWeight:500,
              textAlign:"center",padding:"0 12px"}}>{v.titulo}</div>
          </div>
        </div>
      ) : (
        <div style={{borderRadius:6,overflow:"hidden",aspectRatio:"16/9",position:"relative"}}>
          <iframe
            src={`https://www.youtube.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1`}
            allow="autoplay;encrypted-media;fullscreen"
            style={{width:"100%",height:"100%",position:"absolute",inset:0}}/>
        </div>
      )}
      <div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:11,color:T.subtle}}>{v.canal}</div>
        {open && <button onClick={()=>setOpen(false)}
          style={{fontSize:10,color:T.muted,background:"none",border:"none",cursor:"pointer",
            fontFamily:"'Jost',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase"}}>
          Cerrar
        </button>}
      </div>
    </div>
  );
};

const MedCard = ({med,dosis,cuando,nota,contraindicacion}) => {
  const m = MEDICINES[med] || MEDICINES.sildenafil;
  return (
    <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:6,
      overflow:"hidden",marginBottom:14}}>
      <div style={{display:"flex",gap:0}}>
        <div style={{width:90,flexShrink:0,position:"relative",overflow:"hidden"}}>
          <ImgWithFallback src={m.img} alt={med}
            style={{width:"100%",height:"100%",objectFit:"cover",minHeight:90}}/>
          <div style={{position:"absolute",inset:0,
            background:`linear-gradient(135deg,${m.color}99,${m.color}44)`}}/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
            justifyContent:"center"}}>
            <PillShape shape={m.shape} color={m.color}/>
          </div>
        </div>
        <div style={{flex:1,padding:"12px 14px"}}>
          <div style={{fontSize:12,fontWeight:600,color:T.charcoal,marginBottom:2,lineHeight:1.3}}>{med}</div>
          <div style={{fontSize:10,color:m.color,fontWeight:600,letterSpacing:"0.07em",
            textTransform:"uppercase",marginBottom:8}}>{m.desc}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><Label style={{marginBottom:2}}>Dosis</Label>
              <div style={{fontSize:12,fontWeight:700,color:T.gold}}>{dosis}</div></div>
            <div><Label style={{marginBottom:2}}>Cuándo</Label>
              <div style={{fontSize:11,color:T.ink,lineHeight:1.4}}>{cuando}</div></div>
          </div>
        </div>
      </div>
      {nota && (
        <div style={{padding:"9px 14px",background:T.ivory,borderTop:`1px solid ${T.ivoryMid}`,
          fontSize:11,color:T.muted,lineHeight:1.6}}>{nota}</div>
      )}
      {contraindicacion && (
        <div style={{padding:"8px 14px",background:T.dangerFaint,borderTop:`1px solid rgba(192,57,43,.12)`,
          fontSize:11,color:T.danger,lineHeight:1.5}}>Contraindicado: {contraindicacion}</div>
      )}
    </div>
  );
};

const PillShape = ({shape,color}) => {
  if (shape==="almond") return (
    <svg width="32" height="18" viewBox="0 0 32 18"><ellipse cx="16" cy="9" rx="14" ry="7" fill="rgba(255,255,255,.85)"/>
      <ellipse cx="16" cy="9" rx="14" ry="7" fill="none" stroke={color} strokeWidth="1.5"/></svg>
  );
  if (shape==="capsule") return (
    <svg width="32" height="14" viewBox="0 0 32 14">
      <rect x="2" y="2" width="28" height="10" rx="5" fill="rgba(255,255,255,.85)"/>
      <rect x="16" y="2" width="14" height="10" rx="5" fill={color} opacity=".4"/>
      <rect x="2" y="2" width="28" height="10" rx="5" fill="none" stroke={color} strokeWidth="1.5"/></svg>
  );
  if (shape==="tube") return (
    <svg width="14" height="32" viewBox="0 0 14 32">
      <rect x="2" y="2" width="10" height="28" rx="5" fill="rgba(255,255,255,.85)"/>
      <rect x="2" y="2" width="10" height="28" rx="5" fill="none" stroke={color} strokeWidth="1.5"/>
      <rect x="2" y="20" width="10" height="10" rx="0" fill={color} opacity=".3"/></svg>
  );
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="rgba(255,255,255,.85)"/>
      <circle cx="11" cy="11" r="9" fill="none" stroke={color} strokeWidth="1.5"/>
      <circle cx="11" cy="11" r="4" fill={color} opacity=".5"/></svg>
  );
};

const SectionHeader = ({src,title,sub,seed}) => (
  <div style={{position:"relative",height:140,overflow:"hidden",flexShrink:0}}>
    <ImgWithFallback src={src} alt={title} seed={seed}
      style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
    <div style={{position:"absolute",inset:0,background:"rgba(250,248,245,0.86)"}}/>
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
      justifyContent:"flex-end",padding:"0 20px 18px"}}>
      {sub&&<div style={{fontSize:10,letterSpacing:"0.18em",color:T.gold,fontWeight:600,
        textTransform:"uppercase",marginBottom:4}}>{sub}</div>}
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:600,
        color:T.charcoal}}>{title}</div>
    </div>
  </div>
);

const PAISES = ["México","España","Argentina","Colombia","Chile","Perú","Venezuela","Ecuador","Estados Unidos","Otro"];
const CONDICIONES = ["Disfunción Eréctil","Eyaculación Precoz","Bajo Deseo Sexual","Problemas de Próstata","Testosterona Baja","Infertilidad Masculina","Dolor Pélvico Crónico","Otro"];

const PROTOCOLS = {
  "Disfunción Eréctil":{
    meds:[
      {med:"sildenafil",nombre:"Sildenafil (Viagra / Liqrev / Viamax)",dosis:"25–100 mg",
       cuando:"60 min antes — máx 1 vez/día",nota:"Efecto 4–6 h. No ingerir con comidas grasas.",
       contraindicacion:"Nitratos, nitroprusiato, hipotensión severa"},
      {med:"tadalafil",nombre:"Tadalafil (Cialis / Adcirca)",dosis:"10 mg o 2.5 mg diario",
       cuando:"30 min antes o dosis diaria continua",nota:"Ventana terapéutica 36 h. Ideal para uso regular."},
      {med:"sildenafil",nombre:"Vardenafil (Levitra / Staxyn)",dosis:"10 mg",
       cuando:"25–60 min antes",nota:"Alternativa si Sildenafil es ineficaz."},
    ],
    ejercicios:[
      {nombre:"Kegel masculino",musculo:"Músculo pubococcígeo",prescripcion:"3 series × 15 contracciones × 5 seg — descanso 5 seg",
       frec:"2 veces al día",ben:"Mejora función eréctil y control urinario",videoKey:"kegel"},
      {nombre:"Marcha aeróbica",musculo:"Sistema cardiovascular y vascular pélvico",prescripcion:"30 min a ritmo moderado-vigoroso (60–70% FC máx)",
       frec:"5 días a la semana",ben:"Mejora flujo sanguíneo peneano y función endotelial",videoKey:"aerobico"},
      {nombre:"Sentadilla con peso corporal",musculo:"Cuádriceps, glúteos, core",prescripcion:"4 series × 12 rep — descanso 90 seg entre series",
       frec:"3 veces/semana en días alternos",ben:"Estímulo hormonal para producción de testosterona",videoKey:"sentadilla"},
    ]
  },
  "Eyaculación Precoz":{
    meds:[
      {med:"dapoxetina",nombre:"Dapoxetina (Priligy / Duxetine)",dosis:"30 mg (hasta 60 mg si insuficiente)",
       cuando:"1–3 horas antes de la relación",nota:"Único ISRS aprobado específicamente para EP.",
       contraindicacion:"IMAO, triptanos, insuficiencia hepática"},
      {med:"emla",nombre:"Crema EMLA (Lidocaína 2.5% + Prilocaína 2.5%)",dosis:"Cantidad pequeña en glande",
       cuando:"20 min antes — lavar antes de RS",nota:"Reduce sensibilidad local sin afectar a la pareja con uso correcto."},
    ],
    ejercicios:[
      {nombre:"Técnica Start-Stop",musculo:"Sistema nervioso autónomo, suelo pélvico",
       prescripcion:"Estimulación hasta 80% de excitación → pausa 30 seg → repetir 3 ciclos",
       frec:"3 sesiones semanales de práctica individual",ben:"Condiciona reflejo eyaculatorio y aumenta umbral",videoKey:"startStop"},
      {nombre:"Compresión (Masters & Johnson)",musculo:"Músculo bulboesponjoso",
       prescripcion:"Comprimir glande entre pulgar e índice × 20 seg al percibir urgencia",
       frec:"Aplicar durante la relación según necesidad",ben:"Interrupción mecánica del reflejo eyaculatorio",videoKey:"compresion"},
      {nombre:"Kegel inverso",musculo:"Suelo pélvico — apertura",
       prescripcion:"Empujar hacia afuera 6 seg × 10 rep — relajación completa entre rep",
       frec:"2 veces al día",ben:"Control activo para retrasar eyaculación",videoKey:"kegInverso"},
    ]
  },
  "Testosterona Baja":{
    meds:[
      {med:"testosterona",nombre:"Testosterona gel (Testogel / AndroGel 1%)",dosis:"50 mg/día (1 sobre)",
       cuando:"Cada mañana — hombros, brazos o abdomen",nota:"Monitoreo de niveles cada 3 meses. Evitar contacto con piel de otros."},
      {med:"zinc",nombre:"Zinc + Selenio (Viasil / Androvit)",dosis:"Zinc 25 mg + Selenio 100 mcg",
       cuando:"Una vez al día con la comida",nota:"Apoyo a producción endógena de testosterona. Seguro a largo plazo."},
    ],
    ejercicios:[
      {nombre:"Entrenamiento de fuerza compuesto",musculo:"Grandes grupos musculares (piernas, espalda, pecho)",
       prescripcion:"Sentadilla + Peso muerto + Press banca: 4 series × 8 rep con carga alta",
       frec:"3 días/semana con descanso entre sesiones",ben:"Mayor estímulo de testosterona endógena documentado clínicamente",videoKey:"fuerzaComp"},
      {nombre:"Kegel masculino",musculo:"Suelo pélvico",
       prescripcion:"3 series × 15 contracciones sostenidas 5 seg",
       frec:"2 veces al día",ben:"Función sexual y urinaria mejorada",videoKey:"kegel"},
    ]
  },
};

const SYSTEM = (p) =>
`Eres el Dr. Vitalis, urólogo con subespecialidad en medicina sexual masculina, 25 años de experiencia. Tono profesional, cálido, directo. NUNCA uses emojis.

PACIENTE: ${p.nombre||"Paciente"}, ${p.edad} años, ${p.pais}.
CONDICIÓN: ${p.condicion} — ${p.tiempo}. OBJETIVO: ${p.objetivo}.
MEDICAMENTOS: ${p.medicamentos}. ALERGIAS: ${p.alergias}.
HTA: ${p.presion} | DM: ${p.diabetes} | CARDIOPATÍA: ${p.cardio}.

REGLAS:
1. Siempre en español, sin emojis, tono médico profesional.
2. Nombres comerciales específicos para ${p.pais||"su país"} + genérico entre paréntesis.
3. Dosis exactas: "Sildenafil (Viagra) 50 mg, 60 min antes, máx 100 mg/día."
4. Adaptar TODO al historial clínico. Verificar contraindicaciones HTA+DM+cardiopatía.
5. Si pregunta es urgente/previa a RS: protocolo inmediato y conciso en primer párrafo.
6. Ejercicios: nombre técnico, músculos, series×rep×duración, frecuencia semanal.
7. Encabezados en mayúsculas para secciones largas.
8. Indicar cuándo consultar urgente: dolor torácico, priapismo >4h, hematuria.
9. Recomendaciones farmacológicas: terminar con "Nota: este protocolo complementa la evaluación médica presencial."`;

const ChatView = ({perfil}) => {
  const [msgs,setMsgs] = useState([{role:"assistant",content:
    `Buenas tardes, ${perfil.nombre||"estimado paciente"}. Soy el Dr. Vitalis, su urólogo especialista en salud sexual masculina.\n\nHe revisado su perfil clínico. Podemos comenzar por su protocolo personalizado, opciones farmacológicas disponibles en ${perfil.pais||"su país"} con dosis exactas, o cualquier consulta urgente — incluso antes de una relación sexual, donde respondo de forma inmediata.\n\n¿Por dónde desea comenzar?`}]);
  const [input,setInput] = useState("");
  const [loading,setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,loading]);

  const send = async (text) => {
    if (!text.trim()||loading) return;
    const newMsgs = [...msgs,{role:"user",content:text}];
    setMsgs(newMsgs); setInput(""); setLoading(true);
    try {
      const res = await fetch("/api/vitalis",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          systemPrompt:SYSTEM(perfil),
          messages:newMsgs.map(m=>({role:m.role,content:m.content}))
        })
      });
      const data = await res.json();
      const reply = data.reply||"Error de respuesta. Intente nuevamente.";
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    } catch {
      setMsgs(p=>[...p,{role:"assistant",content:"Error de conexión. Verifique su acceso a internet."}]);
    }
    setLoading(false);
  };

  const QUICK = ["Protocolo personalizado completo","Qué tomar antes de una relación sexual",
    "Ejercicios terapéuticos para mi condición","Medicamentos con dosis exactas para mi país",
    "Plan de mejora para las próximas 4 semanas"];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.cream}}>
      <div style={{padding:"12px 18px",background:T.white,borderBottom:`1px solid ${T.border}`,
        display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <ImgWithFallback src={IMG.doctor} alt="Dr. Vitalis"
          style={{width:38,height:38,borderRadius:"50%",objectFit:"cover",
            flexShrink:0,border:`1.5px solid ${T.border}`}}/>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600,
            color:T.charcoal}}>Dr. Vitalis</div>
          <div style={{fontSize:10,color:T.teal,fontWeight:500,letterSpacing:"0.04em"}}>
            Disponible · Respuesta inmediata
          </div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"18px 16px",display:"flex",
        flexDirection:"column",gap:14}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8}}>
            {m.role==="assistant"&&(
              <ImgWithFallback src={IMG.doctor} alt=""
                style={{width:26,height:26,borderRadius:"50%",objectFit:"cover",
                  flexShrink:0,marginTop:4,border:`1px solid ${T.border}`}}/>
            )}
            <div style={{maxWidth:"80%",padding:"11px 14px",
              borderRadius:m.role==="user"?"12px 3px 12px 12px":"3px 12px 12px 12px",
              background:m.role==="user"?T.charcoal:T.white,
              color:m.role==="user"?T.white:T.ink,fontSize:13,lineHeight:1.8,
              border:m.role==="assistant"?`1px solid ${T.border}`:"none",
              whiteSpace:"pre-wrap",fontFamily:"'Jost',sans-serif"}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <ImgWithFallback src={IMG.doctor} alt=""
              style={{width:26,height:26,borderRadius:"50%",objectFit:"cover",
                flexShrink:0,marginTop:4,border:`1px solid ${T.border}`}}/>
            <div style={{padding:"11px 16px",background:T.white,borderRadius:"3px 12px 12px 12px",
              border:`1px solid ${T.border}`,display:"flex",gap:5,alignItems:"center"}}>
              {[0,.18,.36].map(d=>(
                <div key={d} style={{width:5,height:5,borderRadius:"50%",background:T.muted,
                  animation:`pulse 1.1s ${d}s ease infinite`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {msgs.length<3&&(
        <div style={{padding:"0 16px 10px",display:"flex",flexDirection:"column",gap:5}}>
          <Label>Consultas frecuentes</Label>
          {QUICK.map(q=>(
            <button key={q} onClick={()=>send(q)}
              style={{padding:"9px 13px",borderRadius:3,background:T.white,
                border:`1px solid ${T.border}`,color:T.ink,fontSize:12,
                cursor:"pointer",fontFamily:"'Jost',sans-serif",textAlign:"left"}}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{padding:"10px 14px",borderTop:`1px solid ${T.border}`,
        display:"flex",gap:8,background:T.white,flexShrink:0}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);}}}
          placeholder="Escriba su consulta..."
          style={{flex:1,padding:"9px 13px",background:T.cream,border:`1px solid ${T.border}`,
            borderRadius:3,color:T.ink,fontSize:13,fontFamily:"'Jost',sans-serif"}}/>
        <button onClick={()=>send(input)} disabled={!input.trim()||loading}
          style={{padding:"9px 16px",borderRadius:3,
            background:input.trim()&&!loading?T.charcoal:T.border,border:"none",
            color:T.white,fontSize:10,fontFamily:"'Jost',sans-serif",fontWeight:600,
            letterSpacing:"0.08em",textTransform:"uppercase",cursor:input.trim()&&!loading?"pointer":"not-allowed",
            flexShrink:0}}>
          Enviar
        </button>
      </div>
    </div>
  );
};

const ProtocolView = ({perfil}) => {
  const [tab,setTab] = useState("med");
  const cond = perfil.condicion || "Disfunción Eréctil";
  const proto = PROTOCOLS[cond] || PROTOCOLS["Disfunción Eréctil"];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <SectionHeader src={IMG.pills} title={cond} sub="Plan médico personalizado" seed="pills"/>

      <div style={{display:"flex",background:T.white,borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        {[{id:"med",label:"Medicamentos"},{id:"ej",label:"Ejercicios con video"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"11px 4px",background:"transparent",border:"none",
              cursor:"pointer",fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,
              letterSpacing:"0.08em",textTransform:"uppercase",
              color:tab===t.id?T.gold:T.subtle,
              borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent"}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:18}}>
        {tab==="med" && (
          <>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
              <Chip text={perfil.pais||"Su país"}/>
              {perfil.presion==="Si"&&<Chip text="HTA" color={T.danger}/>}
              {perfil.diabetes&&perfil.diabetes!=="No"&&perfil.diabetes!=="No sé"&&
                <Chip text="Diabetes" color={T.danger}/>}
              {perfil.cardio==="Si"&&<Chip text="Cardiopatía" color={T.danger}/>}
            </div>

            {proto.meds.map((m,i)=>(
              <MedCard key={i} {...m}/>
            ))}

            <div style={{padding:"10px 13px",background:T.dangerFaint,
              border:`1px solid rgba(192,57,43,.18)`,borderRadius:4,
              fontSize:12,color:T.danger,lineHeight:1.6}}>
              Todos los medicamentos requieren prescripción médica. Consulte a su médico antes de iniciar cualquier tratamiento.
            </div>
          </>
        )}

        {tab==="ej" && (
          <>
            <div style={{marginBottom:16}}>
              <ImgWithFallback src={IMG.sport} alt="Terapia física"
                style={{width:"100%",height:110,objectFit:"cover",borderRadius:6,display:"block"}}/>
            </div>
            {proto.ejercicios.map((e,i)=>(
              <div key={i} style={{background:T.white,border:`1px solid ${T.border}`,
                borderRadius:6,marginBottom:16,overflow:"hidden"}}>
                <div style={{padding:"12px 14px",background:T.ivory,
                  borderBottom:`1px solid ${T.ivoryMid}`}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600,
                    color:T.charcoal,marginBottom:4}}>{e.nombre}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <Chip text={e.frec} color={T.teal}/>
                    <Chip text={e.musculo} color={T.muted}/>
                  </div>
                </div>
                <div style={{padding:"12px 14px"}}>
                  <Label>Prescripción</Label>
                  <div style={{fontSize:13,color:T.ink,lineHeight:1.6,marginBottom:10}}>
                    {e.prescripcion}
                  </div>
                  <div style={{padding:"8px 11px",background:T.tealFaint,borderRadius:3,
                    borderLeft:`3px solid ${T.teal}`,fontSize:12,color:T.teal,
                    lineHeight:1.6,marginBottom:14}}>
                    {e.ben}
                  </div>
                  <Label>Video tutorial</Label>
                  <VideoCard videoKey={e.videoKey}/>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const CalendarView = () => {
  const today = new Date();
  const [sel,setSel] = useState(today.getDate());
  const DIAS=["D","L","M","X","J","V","S"];
  const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const fd=new Date(today.getFullYear(),today.getMonth(),1).getDay();
  const dim=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
  const agenda={
    [today.getDate()]:[
      {cat:"Kegel",hora:"07:00",texto:"Kegel matutino — 3 series × 15 contracciones"},
      {cat:"Medicamento",hora:"08:00",texto:"Medicamento o suplemento con desayuno"},
      {cat:"Cardio",hora:"18:00",texto:"Marcha aeróbica — 30 minutos"},
      {cat:"Kegel",hora:"21:00",texto:"Kegel nocturno — 3 series × 15"},
    ],
    [today.getDate()+1]:[
      {cat:"Fuerza",hora:"07:30",texto:"Entrenamiento de fuerza compuesto — 4 × 8"},
      {cat:"Medicamento",hora:"08:00",texto:"Medicamento con desayuno"},
    ],
    [today.getDate()+2]:[
      {cat:"Kegel",hora:"07:00",texto:"Kegel matutino"},
      {cat:"Cardio",hora:"17:30",texto:"Marcha aeróbica — 30 min"},
    ],
  };
  const cc={Kegel:T.gold,Medicamento:T.teal,Cardio:"#5B7FCA",Fuerza:"#B06B35"};
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <SectionHeader src={IMG.calendar} title={`${MESES[today.getMonth()]} ${today.getFullYear()}`} sub="Plan terapéutico" seed="calendar"/>
      <div style={{flex:1,overflowY:"auto",padding:18}}>
        <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:4,
          padding:14,marginBottom:18}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:8}}>
            {DIAS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:600,
              color:T.subtle,letterSpacing:"0.1em",padding:"3px 0"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {Array(fd).fill(null).map((_,i)=><div key={`e${i}`}/>)}
            {Array(dim).fill(null).map((_,i)=>{
              const d=i+1,isT=d===today.getDate(),isS=d===sel,hasE=!!agenda[d];
              return(
                <div key={d} onClick={()=>setSel(d)}
                  style={{aspectRatio:1,display:"flex",flexDirection:"column",alignItems:"center",
                    justifyContent:"center",borderRadius:3,cursor:"pointer",fontSize:12,
                    fontWeight:isS||isT?600:400,
                    background:isS?T.charcoal:isT?T.goldFaint:"transparent",
                    color:isS?T.white:isT?T.gold:T.ink,
                    border:isT&&!isS?`1px solid ${T.gold}`:"1px solid transparent",
                    transition:"all .15s"}}>
                  {d}{hasE&&<div style={{width:4,height:4,borderRadius:"50%",marginTop:1,
                    background:isS?"rgba(255,255,255,.5)":T.gold}}/>}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,
            color:T.charcoal,marginBottom:12}}>
            {sel===today.getDate()?"Hoy":`Día ${sel}`}, {MESES[today.getMonth()]}
          </div>
          {(agenda[sel]||[{cat:"Descanso",hora:"",texto:"Día de recuperación activa."}]).map((ev,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,
              padding:"11px 14px",background:T.white,border:`1px solid ${T.border}`,
              borderRadius:4,marginBottom:8,borderLeft:`3px solid ${cc[ev.cat]||T.border}`}}>
              <Chip text={ev.cat} color={cc[ev.cat]||T.muted}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,color:T.ink}}>{ev.texto}</div>
                {ev.hora&&<div style={{fontSize:11,color:T.subtle,marginTop:1}}>{ev.hora}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:4,overflow:"hidden"}}>
          <div style={{padding:"11px 14px",background:T.ivory,borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600,
              color:T.charcoal}}>Recordatorios activos</div>
          </div>
          {[{h:"07:00",t:"Kegel matutino",d:"Lunes a Domingo"},
            {h:"08:00",t:"Medicamento / suplemento",d:"Lunes a Domingo"},
            {h:"18:00",t:"Cardio aeróbico",d:"Lun, Mié, Vie, Sáb"},
            {h:"21:00",t:"Kegel nocturno",d:"Lunes a Domingo"}].map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"10px 14px",borderBottom:i<3?`1px solid ${T.ivoryMid}`:"none"}}>
              <div>
                <div style={{fontSize:12,color:T.ink,fontWeight:500}}>{r.h} — {r.t}</div>
                <div style={{fontSize:10,color:T.subtle,marginTop:1}}>{r.d}</div>
              </div>
              <div style={{width:7,height:7,borderRadius:"50%",background:T.teal}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardView = ({perfil,onNavigate}) => (
  <div style={{overflowY:"auto",height:"100%",background:T.cream}}>
    <div style={{position:"relative",height:180,overflow:"hidden"}}>
      <ImgWithFallback src={IMG.clinic} alt="Clínica"
        style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
      <div style={{position:"absolute",inset:0,
        background:"linear-gradient(to bottom,rgba(250,248,245,0) 15%,rgba(250,248,245,.97))"}}/>
      <div style={{position:"absolute",bottom:16,left:18}}>
        <div style={{fontSize:9,letterSpacing:"0.16em",color:T.gold,fontWeight:600,
          textTransform:"uppercase",marginBottom:4}}>Panel principal</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:600,
          color:T.charcoal}}>Bienvenido, {perfil.nombre||"paciente"}.</div>
      </div>
    </div>

    <div style={{padding:"4px 18px 32px"}}>
      <div onClick={()=>onNavigate("chat")} style={{cursor:"pointer",
        background:T.charcoal,borderRadius:6,padding:"14px 16px",marginBottom:18,
        display:"flex",alignItems:"center",gap:12}}>
        <ImgWithFallback src={IMG.doctor} alt=""
          style={{width:40,height:40,borderRadius:"50%",objectFit:"cover",
            flexShrink:0,border:"2px solid rgba(255,255,255,.15)"}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:T.white,marginBottom:2}}>
            Consultar al Dr. Vitalis ahora
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>
            Disponible de inmediato · Incluso antes de una relación sexual
          </div>
        </div>
        <div style={{color:"rgba(255,255,255,.3)",fontSize:20}}>›</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
        {[{label:"Días de tratamiento",val:"1",sub:"Inicio hoy"},
          {label:"Ejercicios completados",val:"0",sub:"Primer día"},
          {label:"Dosis tomadas",val:"0",sub:"1 pendiente"},
          {label:"Adherencia",val:"100%",sub:"Excelente inicio"}].map(s=>(
          <div key={s.label} style={{background:T.white,border:`1px solid ${T.border}`,
            borderRadius:4,padding:"14px 14px"}}>
            <div style={{fontSize:22,fontWeight:600,fontFamily:"'Playfair Display',serif",
              color:T.charcoal,marginBottom:2}}>{s.val}</div>
            <div style={{fontSize:11,color:T.ink,fontWeight:500,marginBottom:1}}>{s.label}</div>
            <div style={{fontSize:10,color:T.subtle}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:4,
        overflow:"hidden",marginBottom:18}}>
        <div style={{padding:"11px 14px",background:T.ivory,borderBottom:`1px solid ${T.ivoryMid}`}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600,
            color:T.charcoal}}>Plan de hoy</div>
        </div>
        {[{h:"07:00",t:"Kegel matutino — 3 series × 15"},
          {h:"08:00",t:"Medicamento con desayuno"},
          {h:"18:00",t:"Marcha aeróbica — 30 min"},
          {h:"21:00",t:"Kegel nocturno — 3 series × 15"}].map((a,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 14px",
            borderBottom:i<3?`1px solid ${T.ivoryMid}`:"none"}}>
            <div style={{width:14,height:14,borderRadius:"50%",border:`1.5px solid ${T.border}`,flexShrink:0}}/>
            <span style={{fontSize:13,color:T.ink}}>{a.h} · {a.t}</span>
          </div>
        ))}
      </div>

      <div style={{background:T.ivory,border:`1px solid ${T.border}`,borderRadius:4,padding:16,
        marginBottom:18}}>
        <Label>Recomendación del día</Label>
        <p style={{fontSize:13,color:T.muted,lineHeight:1.8}}>
          La constancia supera la intensidad. Los ejercicios de Kegel practicados diariamente
          muestran resultados clínicamente verificables entre la sexta y la duodécima semana.
          No omita ninguna sesión esta primera semana.
        </p>
        <Rule style={{margin:"12px 0"}}/>
        <div style={{fontSize:11,color:T.subtle}}>Dr. Vitalis · {new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>

      <div onClick={()=>onNavigate("lanzar")} style={{cursor:"pointer",
        background:`linear-gradient(135deg,${T.gold},${T.goldDark})`,borderRadius:6,
        padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:600,color:T.white,marginBottom:2}}>
            Quiero vender esta app
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>
            Guía completa de lanzamiento y monetización
          </div>
        </div>
        <div style={{color:"rgba(255,255,255,.6)",fontSize:18}}>›</div>
      </div>
    </div>
  </div>
);

const LaunchView = () => {
  const [tab,setTab] = useState("tech");
  const Section = ({title,items}) => (
    <div style={{marginBottom:20}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:600,
        color:T.charcoal,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:3,height:18,background:T.gold,borderRadius:2,flexShrink:0}}/>
        {title}
      </div>
      {items.map((item,i)=>(
        <div key={i} style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:4,
          padding:"12px 14px",marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:600,color:T.charcoal,marginBottom:4}}>{item.t}</div>
          <div style={{fontSize:12,color:T.muted,lineHeight:1.7}}>{item.d}</div>
          {item.link&&<div style={{marginTop:6}}>
            <a href={item.link} target="_blank" rel="noopener noreferrer"
              style={{fontSize:11,color:T.teal,textDecoration:"none",fontWeight:500}}>
              {item.link} →
            </a>
          </div>}
          {item.code&&<div style={{marginTop:8,padding:"8px 10px",background:T.ivory,
            borderRadius:3,fontSize:11,fontFamily:"monospace",color:T.ink,
            border:`1px solid ${T.ivoryMid}`}}>{item.code}</div>}
        </div>
      ))}
    </div>
  );

  const TECH = [
    {t:"1. API de Anthropic (IA del Dr. Vitalis)",
     d:"La IA ya funciona en este artifact de Claude. Para producción, necesitas una API key propia de Anthropic. Crea una cuenta en:",
     link:"https://console.anthropic.com",
     code:"ANTHROPIC_API_KEY=sk-ant-xxxxx"},
    {t:"2. Stripe — Pagos reales",
     d:"Crea una cuenta Stripe, obtén tu publishable key y secret key. El frontend usa Stripe.js y el backend maneja webhooks para activar/cancelar suscripciones.",
     link:"https://dashboard.stripe.com",
     code:"STRIPE_SECRET_KEY=sk_live_xxxxx\nSTRIPE_WEBHOOK_SECRET=whsec_xxxxx"},
    {t:"3. Backend recomendado — Next.js + Netlify",
     d:"Next.js 15 con App Router + API Routes maneja auth, Stripe webhooks y llamadas al API de Anthropic de forma segura. Deploy en Netlify automático desde GitHub.",
     link:"https://netlify.com",
     code:"netlify init"},
    {t:"4. Base de datos — Supabase (gratuito para empezar)",
     d:"Guarda perfiles médicos, historial de chat, suscripciones y adherencia. Row Level Security garantiza privacidad total por usuario.",
     link:"https://supabase.com",
     code:"npm install @supabase/supabase-js"},
    {t:"5. Notificaciones push — OneSignal",
     d:"Recordatorios de dosis y ejercicios vía push notification. Crítico para la adherencia al tratamiento. Gratuito hasta 10,000 suscriptores.",
     link:"https://onesignal.com"},
    {t:"6. App móvil — Capacitor (iOS + Android)",
     d:"Convierte la web app en app nativa para App Store y Google Play con Capacitor. Misma base de código React.",
     code:"npm install @capacitor/core @capacitor/ios @capacitor/android"},
  ];

  const LEGAL = [
    {t:"Aviso legal y responsabilidad",
     d:"Incluir en toda la app: 'El contenido de Vitalis tiene carácter informativo y no constituye diagnóstico médico ni reemplaza la consulta con un profesional de la salud.' Consúltalo con un abogado especializado en telemedicina de tu país."},
    {t:"Protección de datos médicos",
     d:"GDPR (Europa), LFPDPPP (México), LGPD (Brasil). Los datos de salud son categoría especial. Necesitas: política de privacidad explícita, consentimiento informado al registrarse, cifrado de datos en tránsito y reposo, derecho a eliminar datos."},
    {t:"Telemedicina por país",
     d:"México: NOM-004-SSA3-2012. España: Ley 41/2002. Colombia: Resolución 2654. Consulta el marco legal de telemedicina de tu mercado objetivo antes de lanzar."},
    {t:"Términos de Stripe para salud",
     d:"Stripe permite pagos para plataformas de salud y wellness en la mayoría de países. Asegúrate de que tu descripción del negocio en Stripe sea precisa."},
  ];

  const MKT = [
    {t:"Estrategia de precio",
     d:"$599 MXN/mes es el precio de lanzamiento. Considera: Plan Básico $399 MXN (chat + protocolo) — Plan Pro $599 MXN (+ videos + calendario) — Plan Premium $999 MXN (+ sesión mensual con médico real). Prueba gratuita 7 días para reducir fricción de conversión."},
    {t:"Canales de adquisición principales",
     d:"1. Facebook/Instagram Ads (hombres 30–60 años, intereses: salud, fitness, relaciones). 2. Google Ads (keywords: disfunción eréctil tratamiento, eyaculación precoz, testosterona baja). 3. YouTube Ads pre-roll en canales de salud masculina y fitness."},
    {t:"Contenido orgánico — TikTok + Instagram",
     d:"Crear cuenta del 'Dr. Vitalis' con consejos médicos cortos sobre salud sexual masculina. TikTok tiene alta viralidad para salud y es menos competitivo que Instagram para este nicho. Publicar 1 video/día durante 90 días."},
    {t:"SEO — posicionamiento orgánico",
     d:"Crear blog en vitalis.health con artículos como: 'Medicamentos para disfunción eréctil en México 2025', 'Ejercicios de Kegel masculinos paso a paso', 'Causas de testosterona baja'. Contenido médico ranquea bien en Google."},
    {t:"Partnerships estratégicos",
     d:"Urólogos y médicos generales que deriven pacientes. Farmacias online. Clínicas de salud masculina. Gympass o redes de gimnasios. Influencers de salud y fitness masculina (micro-influencers 50K–200K tienen mejor ROI)."},
    {t:"Métricas clave a monitorear",
     d:"CAC (Costo de Adquisición por Cliente) objetivo: <$800 MXN. LTV (Valor de Vida) objetivo: >$4,200 MXN (7+ meses promedio). Churn mensual objetivo: <10%. MRR (Monthly Recurring Revenue) meta año 1: $200,000 MXN+."},
    {t:"Mercado objetivo — TAM",
     d:"Solo en México + España + Colombia hay +8 millones de hombres con DE, EP o T baja activamente buscando soluciones. Con 0.1% de penetración = 8,000 usuarios × $599 MXN = $4,792,000 MXN MRR (~$240,000 USD). El mercado global de telesalud masculina crece 15% anual."},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <SectionHeader src={IMG.clinic} title="Guía de Lanzamiento" sub="Cómo vender Vitalis" seed="launch"/>
      <div style={{display:"flex",background:T.white,borderBottom:`1px solid ${T.border}`,flexShrink:0,overflowX:"auto"}}>
        {[{id:"tech",l:"Tecnología"},{id:"legal",l:"Legal"},{id:"mkt",l:"Marketing"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"11px 16px",background:"transparent",border:"none",flexShrink:0,
              cursor:"pointer",fontFamily:"'Jost',sans-serif",fontSize:11,fontWeight:600,
              letterSpacing:"0.08em",textTransform:"uppercase",
              color:tab===t.id?T.gold:T.subtle,
              borderBottom:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent"}}>
            {t.l}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:18}}>
        {tab==="tech" && (
          <>
            <div style={{padding:"12px 14px",background:"rgba(45,125,111,.06)",
              border:`1px solid ${T.tealLine}`,borderRadius:4,marginBottom:18,
              fontSize:12,color:T.teal,lineHeight:1.7}}>
              El chat con el Dr. Vitalis ya funciona al 100% gracias a la API de Claude integrada en este artifact. Para venderla como producto independiente, sigue estos pasos en orden.
            </div>
            <Section title="Stack tecnológico recomendado" items={TECH}/>
          </>
        )}
        {tab==="legal" && (
          <>
            <div style={{padding:"12px 14px",background:T.dangerFaint,
              border:`1px solid rgba(192,57,43,.18)`,borderRadius:4,marginBottom:18,
              fontSize:12,color:T.danger,lineHeight:1.7}}>
              Los datos de salud son la categoría de mayor protección legal. Consulta un abogado antes de lanzar en cualquier mercado.
            </div>
            <Section title="Marco legal y cumplimiento" items={LEGAL}/>
          </>
        )}
        {tab==="mkt" && (
          <>
            <div style={{padding:"12px 14px",background:T.goldFaint,
              border:`1px solid ${T.goldLine}`,borderRadius:4,marginBottom:18,
              fontSize:12,color:T.goldDark,lineHeight:1.7}}>
              El nicho de salud sexual masculina tiene alta demanda y baja competencia en SaaS. Es uno de los mercados con mayor LTV y menor sensibilidad al precio.
            </div>
            <Section title="Estrategia de go-to-market" items={MKT}/>
          </>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   LANDING
═══════════════════════════════════════════════════════════ */
const Landing = ({onStart,onDemo}) => {
  const FEATURES=[
    {t:"Consulta 24/7",d:"Un urólogo especialista responde al instante, incluso minutos antes de una relación sexual."},
    {t:"Protocolo personalizado",d:"Medicamentos con nombre comercial y dosis exactas según su país e historial clínico."},
    {t:"Ejercicios guiados",d:"Rutinas en video para recuperar y mantener la función sexual masculina."},
    {t:"Seguimiento diario",d:"Calendario de adherencia para dosis y ejercicios, sin perder el ritmo."},
  ];
  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100dvh",background:T.cream}}>
      <div style={{position:"relative",height:340,overflow:"hidden"}}>
        <ImgWithFallback src={IMG.hero} alt="Vitalis" seed="hero"
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
        <div style={{position:"absolute",inset:0,
          background:"linear-gradient(180deg,rgba(28,28,30,0.28) 0%,rgba(250,248,245,0.94) 88%)"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
          justifyContent:"flex-end",padding:"0 24px 26px"}}>
          <Chip text="Salud sexual masculina"/>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:700,
            color:T.charcoal,lineHeight:1.05,marginTop:12}}>Dr. Vitalis</div>
          <div style={{fontSize:15,color:T.ink,marginTop:8,lineHeight:1.5}}>
            Su urólogo especialista, disponible 24/7. Discreto, profesional y siempre a su lado.
          </div>
        </div>
      </div>

      <div className="fu" style={{padding:"26px 24px 40px"}}>
        {FEATURES.map((f,i)=>(
          <div key={i} style={{display:"flex",gap:14,marginBottom:20,alignItems:"flex-start"}}>
            <div style={{width:30,height:30,borderRadius:3,flexShrink:0,background:T.goldFaint,
              border:`1px solid ${T.goldLine}`,display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"'Playfair Display',serif",fontWeight:600,color:T.goldDark,fontSize:14}}>{i+1}</div>
            <div>
              <div style={{fontWeight:600,fontSize:15,color:T.charcoal,marginBottom:3}}>{f.t}</div>
              <div style={{fontSize:13,color:T.muted,lineHeight:1.55}}>{f.d}</div>
            </div>
          </div>
        ))}

        <Rule style={{margin:"8px 0 22px"}}/>

        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,color:T.charcoal}}>
            $599 <span style={{fontSize:15,color:T.muted,fontWeight:400}}>MXN / mes</span>
          </div>
          <div style={{fontSize:12,color:T.subtle,marginTop:4}}>Sin permanencia. Cancele cuando quiera.</div>
        </div>

        <Btn onClick={onStart} style={{width:"100%",justifyContent:"center"}}>Comenzar ahora</Btn>
        <Btn onClick={onDemo} variant="outline" style={{width:"100%",justifyContent:"center",marginTop:12}}>
          Ver demostración
        </Btn>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   PAGO (STRIPE)
═══════════════════════════════════════════════════════════ */
const StripePayment = ({onSuccess,onBack}) => {
  const [email,setEmail] = useState("");
  const [nombre,setNombre] = useState("");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  const pagar = async () => {
    setError("");
    if (!email || !email.includes("@")) { setError("Ingrese un correo electrónico válido."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,nombre}),
      });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; return; }
      setError(data.error || "No se pudo iniciar el pago. Intente de nuevo.");
    } catch {
      setError("No se pudo conectar con el servicio de pago. Intente de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100dvh",background:T.cream}}>
      <SectionHeader src={IMG.stripe} title="Suscripción Vitalis Pro" sub="Pago seguro" seed="pay"/>
      <div className="fu" style={{padding:"24px 24px 40px"}}>
        <div style={{padding:"18px 18px",background:T.white,border:`1px solid ${T.border}`,
          borderRadius:4,marginBottom:22}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <div style={{fontWeight:600,fontSize:15,color:T.charcoal}}>Vitalis Pro</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:T.charcoal}}>
              $599 <span style={{fontSize:12,color:T.muted,fontWeight:400}}>MXN/mes</span>
            </div>
          </div>
          <div style={{fontSize:12,color:T.muted,marginTop:6,lineHeight:1.6}}>
            Consulta médica ilimitada con el Dr. Vitalis, protocolo personalizado, medicamentos, ejercicios y calendario de adherencia.
          </div>
        </div>

        <FieldInput label="Nombre" value={nombre} onChange={setNombre} placeholder="Su nombre"/>
        <FieldInput label="Correo electrónico" type="email" value={email} onChange={setEmail}
          placeholder="correo@ejemplo.com"/>

        {error && (
          <div style={{padding:"10px 14px",background:T.dangerFaint,border:`1px solid ${T.danger}40`,
            borderRadius:3,color:T.danger,fontSize:12,marginBottom:16,lineHeight:1.5}}>{error}</div>
        )}

        <Btn onClick={pagar} disabled={loading}
          style={{width:"100%",justifyContent:"center"}}>
          {loading ? "Redirigiendo a pago seguro…" : "Pagar con Stripe"}
        </Btn>
        <Btn onClick={onBack} variant="subtle"
          style={{width:"100%",justifyContent:"center",marginTop:12}}>Volver</Btn>

        <div style={{fontSize:11,color:T.subtle,textAlign:"center",marginTop:18,lineHeight:1.6}}>
          El pago se procesa de forma segura a través de Stripe. Será redirigido para completar su suscripción.
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ONBOARDING
═══════════════════════════════════════════════════════════ */
const Onboarding = ({onComplete}) => {
  const [f,setF] = useState({
    nombre:"",edad:"",pais:"",condicion:"",tiempo:"",objetivo:"",
    medicamentos:"",alergias:"",presion:"",diabetes:"",cardio:"",
  });
  const set = (k) => (v) => setF(prev=>({...prev,[k]:v}));
  const SINO = ["Si","No"];
  const completo = f.nombre && f.edad && f.pais && f.condicion;

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100dvh",background:T.cream}}>
      <SectionHeader src={IMG.doctor} title="Su perfil clínico" sub="Confidencial" seed="onb"/>
      <div className="fu" style={{padding:"24px 24px 40px"}}>
        <div style={{padding:"12px 14px",background:T.tealFaint,border:`1px solid ${T.tealLine}`,
          borderRadius:4,marginBottom:22,fontSize:12,color:T.teal,lineHeight:1.6}}>
          Estos datos permiten al Dr. Vitalis personalizar su protocolo. Toda la información es confidencial.
        </div>

        <FieldInput label="Nombre" value={f.nombre} onChange={set("nombre")} placeholder="Su nombre"/>
        <FieldInput label="Edad" type="number" value={f.edad} onChange={set("edad")} placeholder="Ej. 44"/>
        <FieldInput label="País" value={f.pais} onChange={set("pais")} options={PAISES}/>
        <FieldInput label="Condición principal" value={f.condicion} onChange={set("condicion")} options={CONDICIONES}/>
        <FieldInput label="Tiempo con la condición" value={f.tiempo} onChange={set("tiempo")} placeholder="Ej. 8 meses"/>
        <FieldInput label="Objetivo principal" value={f.objetivo} onChange={set("objetivo")}
          placeholder="Ej. Recuperar erección firme"/>
        <FieldInput label="Medicamentos actuales" value={f.medicamentos} onChange={set("medicamentos")}
          placeholder="Ej. Enalapril 10mg — o Ninguno"/>
        <FieldInput label="Alergias" value={f.alergias} onChange={set("alergias")}
          placeholder="Ej. Ninguna"/>
        <FieldInput label="¿Presión arterial alta?" value={f.presion} onChange={set("presion")} options={SINO}/>
        <FieldInput label="¿Diabetes?" value={f.diabetes} onChange={set("diabetes")} options={["Si","No","No sé"]}/>
        <FieldInput label="¿Cardiopatía?" value={f.cardio} onChange={set("cardio")} options={SINO}/>

        <Btn onClick={()=>onComplete(f)} disabled={!completo}
          style={{width:"100%",justifyContent:"center",marginTop:6}}>
          Iniciar consulta
        </Btn>
        {!completo && (
          <div style={{fontSize:11,color:T.subtle,textAlign:"center",marginTop:12}}>
            Complete nombre, edad, país y condición para continuar.
          </div>
        )}
      </div>
    </div>
  );
};

type Perfil = {
  nombre?: string; edad?: string; pais?: string; condicion?: string;
  tiempo?: string; objetivo?: string; medicamentos?: string; alergias?: string;
  presion?: string; diabetes?: string; cardio?: string;
};

export default function App() {
  const [screen,setScreen] = useState("landing");
  const [perfil,setPerfil] = useState<Perfil>({});
  const [tab,setTab] = useState("dashboard");

  useEffect(()=>{
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        setScreen("onboarding");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  const TABS=[
    {id:"dashboard",label:"Inicio"},
    {id:"chat",label:"Consulta"},
    {id:"protocolo",label:"Protocolo"},
    {id:"calendario",label:"Calendario"},
    {id:"lanzar",label:"Lanzar"},
  ];

  const DEMO_PROFILE = {nombre:"Carlos",edad:"44",pais:"España",
    condicion:"Disfunción Eréctil",tiempo:"8 meses",objetivo:"Recuperar erección firme",
    medicamentos:"Enalapril 10mg",alergias:"Ninguna",presion:"Si",diabetes:"No",cardio:"No"};

  if (screen==="landing") return (
    <><style>{css}</style>
    <Landing onStart={()=>setScreen("payment")}
      onDemo={()=>{setPerfil(DEMO_PROFILE);setScreen("main");}}/></>
  );
  if (screen==="payment") return (
    <><style>{css}</style>
    <StripePayment onSuccess={()=>setScreen("onboarding")} onBack={()=>setScreen("landing")}/></>
  );
  if (screen==="onboarding") return (
    <><style>{css}</style>
    <Onboarding onComplete={d=>{setPerfil(d);setScreen("main");}}/></>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{maxWidth:480,margin:"0 auto",height:"100dvh",display:"flex",
        flexDirection:"column",background:T.cream}}>
        <div style={{padding:"10px 18px",background:T.white,borderBottom:`1px solid ${T.border}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,
              color:T.charcoal,letterSpacing:"0.05em"}}>VITALIS</div>
            <div style={{fontSize:7,letterSpacing:"0.22em",color:T.subtle,textTransform:"uppercase"}}>
              Salud Sexual Masculina
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Chip text="Pro" color={T.teal}/>
            <div style={{width:28,height:28,borderRadius:"50%",background:T.charcoal,
              display:"flex",alignItems:"center",justifyContent:"center",
              color:T.white,fontSize:11,fontWeight:600}}>
              {(perfil.nombre||"P")[0].toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {tab==="dashboard"  && <DashboardView perfil={perfil} onNavigate={setTab}/>}
          {tab==="chat"       && <ChatView perfil={perfil}/>}
          {tab==="protocolo"  && <ProtocolView perfil={perfil}/>}
          {tab==="calendario" && <CalendarView/>}
          {tab==="lanzar"     && <LaunchView/>}
        </div>

        <div style={{display:"flex",background:T.white,borderTop:`1px solid ${T.border}`,
          flexShrink:0,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:"0 0 auto",minWidth:`${100/TABS.length}%`,padding:"11px 2px",
                background:"transparent",border:"none",cursor:"pointer",
                fontFamily:"'Jost',sans-serif",fontSize:9,fontWeight:600,
                letterSpacing:"0.08em",textTransform:"uppercase",
                color:tab===t.id?T.gold:T.subtle,
                borderTop:tab===t.id?`2px solid ${T.gold}`:"2px solid transparent",
                transition:"all .15s"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
