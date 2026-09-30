import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bell,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Expand,
  Flame,
  Grid2X2,
  Hand,
  Home,
  Layers,
  LogOut,
  Monitor,
  Moon,
  Pause,
  Play,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trophy,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { GameObject } from "../../src/components/GameObject";
import "./styles.css";

const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const directions = [
  {
    id: "calma",
    letter: "A",
    name: "Calma editorial",
    short: "Un paso claro. Mucho espacio.",
    font: "Manrope",
    radius: "24 px",
    ref: "Brilliant × Kit",
    note: "Una actividad protagonista, texto breve y detalles precisos. La opción más equilibrada para empezar.",
    tradeoff:
      "La progresión se expresa con una lista tranquila, sin un mapa permanente.",
  },
  {
    id: "jardin",
    letter: "B",
    name: "Jardín de juego",
    short: "Un camino que apetece seguir.",
    font: "DM Sans",
    radius: "32 px",
    ref: "Ahead × Brilliant",
    note: "Un recorrido visible y una sola mascota junto al punto activo. La alternativa más lúdica, con una base adulta.",
    tradeoff:
      "El mapa ocupa más espacio; la biblioteca sigue a un toque en el menú inferior.",
  },
  {
    id: "estudio",
    letter: "C",
    name: "Estudio",
    short: "Todo en su sitio.",
    font: "Inter",
    radius: "16 px",
    ref: "Kit × Brilliant",
    note: "Composición ordenada, navegación muy explícita y superficies casi blancas. Especialmente clara para uso frecuente.",
    tradeoff:
      "Más funcional y menos expresiva. En horizontal el menú pasa al lateral.",
  },
];
const screens = [
  ["home", "Inicio"],
  ["catalog", "Todos los juegos"],
  ["intro", "Antes de jugar"],
  ["game", "Juego"],
  ["result", "Refuerzo y resultado"],
  ["onboarding", "Intereses"],
  ["comfort", "Comodidad"],
  ["activity", "Actividad"],
  ["achievements", "Logros"],
  ["settings", "Ajustes"],
  ["landing", "Presentación"],
  ["login", "Acceso"],
  ["professional", "Profesionales"],
];
const games = [
  {
    id: "memory-pairs",
    name: "Encuentra las parejas",
    area: "Memoria",
    icon: Grid2X2,
    copy: "Descubre las cartas y encuentra los objetos que son iguales.",
  },
  {
    id: "visual-scanning",
    name: "Busca la figura",
    area: "Atención",
    icon: Search,
    copy: "Mira las figuras y toca la que aparece dos veces.",
  },
  {
    id: "word-completion",
    name: "Completa la palabra",
    area: "Lenguaje",
    icon: BookOpen,
    copy: "Elige las letras que completan el nombre del objeto.",
  },
  {
    id: "motor-target",
    name: "Toca la diana",
    area: "Coordinación",
    icon: Target,
    copy: "Toca cada diana cuando aparezca en la pantalla.",
  },
  {
    id: "memory-path",
    name: "Recuerda la secuencia",
    area: "Memoria",
    icon: Brain,
    copy: "Observa las luces y repite el orden en que se encienden.",
  },
  {
    id: "language-naming",
    name: "Ponle nombre",
    area: "Lenguaje",
    icon: BookOpen,
    copy: "Mira el objeto y elige su nombre.",
  },
  {
    id: "categorization",
    name: "Cada cosa en su lugar",
    area: "Organización",
    icon: Layers,
    copy: "Coloca cada objeto en su categoría.",
  },
  {
    id: "motor-tracking",
    name: "Sigue la diana",
    area: "Coordinación",
    icon: Hand,
    copy: "Sigue con el dedo la diana mientras se mueve.",
  },
];
const areas = [
  { name: "Atención", icon: Search, copy: "Observar y encontrar" },
  { name: "Memoria", icon: Brain, copy: "Recordar y relacionar" },
  { name: "Lenguaje", icon: BookOpen, copy: "Nombrar y completar" },
  { name: "Organización", icon: Layers, copy: "Agrupar y ordenar" },
  { name: "Coordinación", icon: Hand, copy: "Tocar y seguir" },
];
const params = new URLSearchParams(location.search);
const initialDirection = directions.some(
  (d) => d.id === params.get("direction"),
)
  ? params.get("direction")
  : "calma";
const initialScreen = screens.some(([id]) => id === params.get("screen"))
  ? params.get("screen")
  : "home";
const isFrame = params.has("frame");
const navItems = [
  { id: "home", label: "Hoy", icon: Home },
  { id: "catalog", label: "Juegos", icon: Grid2X2 },
  { id: "activity", label: "Actividad", icon: AudioLines },
  { id: "settings", label: "Mi cuenta", icon: Users },
];

function Brand() {
  return (
    <span className="brand">
      <img src={asset("brand/neuroia-mark.svg")} alt="" />
      <span>
        neuro<span>ia</span>
        <i />
      </span>
    </span>
  );
}
function Button({
  children,
  onClick,
  secondary = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`action ${secondary ? "secondary" : ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
function IconButton({ icon: Icon, label, onClick }) {
  return (
    <button
      className="icon-button"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon size={22} strokeWidth={1.7} />
    </button>
  );
}
function Art({ game = "memory-pairs", className = "" }) {
  return (
    <img
      className={`companion-art ${className}`}
      src={asset(`images/headers/${game}.png`)}
      alt=""
    />
  );
}
function ObjectPreview({ symbol, label }) {
  return (
    <span className="object-preview" role="img" aria-label={label}>
      <GameObject symbol={symbol} />
    </span>
  );
}
function Eyebrow({ children }) {
  return <p className="eyebrow">{children}</p>;
}
function SectionTitle({ title, link, onClick }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {link && (
        <button className="text-link" onClick={onClick}>
          {link}
          <ArrowUpRight size={18} />
        </button>
      )}
    </div>
  );
}
function Glyph({ icon: Icon, size = 26 }) {
  return (
    <span className="glyph">
      <Icon size={size} strokeWidth={1.65} />
    </span>
  );
}

function SampleGame({ gameIndex, onAnswer }) {
  if (gameIndex === 1)
    return (
      <div className="sample-scan">
        {["🍎", "🥕", "👕", "🍌", "🧦", "🍎", "🥖", "🪥", "🧢"].map(
          (symbol, i) => (
            <button key={i} onClick={onAnswer} aria-label={`Figura ${i + 1}`}>
              <ObjectPreview symbol={symbol} label={`Figura ${i + 1}`} />
            </button>
          ),
        )}
      </div>
    );
  if (gameIndex === 2)
    return (
      <div className="sample-word">
        <ObjectPreview symbol="🍎" label="Manzana" />
        <div className="word-slots">
          {"MAN_ANA".split("").map((letter, i) => (
            <span key={i} className={letter === "_" ? "missing" : ""}>
              {letter === "_" ? "" : letter}
            </span>
          ))}
        </div>
        <div className="word-answers">
          {["S", "Z", "T"].map((letter) => (
            <button key={letter} onClick={onAnswer}>
              {letter}
            </button>
          ))}
        </div>
      </div>
    );
  if (gameIndex === 3 || gameIndex === 7)
    return (
      <div className="sample-arena">
        {gameIndex === 7 && (
          <svg viewBox="0 0 600 240" aria-hidden="true">
            <path d="M80 160 C180 160 170 50 300 90 S400 210 510 120" />
          </svg>
        )}
        <button className="sample-target" onClick={onAnswer} aria-label="Diana">
          <Target size={55} strokeWidth={1.3} />
        </button>
        <span>
          {gameIndex === 3 ? "Toca la diana" : "Sigue la diana con el dedo"}
        </span>
      </div>
    );
  if (gameIndex === 4)
    return (
      <div className="sample-sequence">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className={i === 1 ? "lit" : ""}
            onClick={onAnswer}
            aria-label={`Baliza ${i + 1}`}
          >
            {i === 1 && <span />}
          </button>
        ))}
      </div>
    );
  if (gameIndex === 5)
    return (
      <div className="sample-naming">
        <ObjectPreview symbol="🍎" label="Manzana" />
        <div>
          {["Manzana", "Naranja", "Pera"].map((word) => (
            <Button secondary key={word} onClick={onAnswer}>
              {word}
            </Button>
          ))}
        </div>
      </div>
    );
  return (
    <div className="sample-categories">
      <ObjectPreview symbol="🍎" label="Manzana" />
      <div>
        {[
          { name: "Alimentos", symbol: "🥕" },
          { name: "Ropa", symbol: "👕" },
          { name: "Higiene", symbol: "🪥" },
        ].map(({ name, symbol }) => (
          <button key={name} onClick={onAnswer}>
            <ObjectPreview symbol={symbol} label={name} />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Journey({ open, direction }) {
  return (
    <div className={`journey ${direction}`}>
      <div className="journey-heading">
        <Eyebrow>Tu propuesta de hoy</Eyebrow>
        <h2>
          Pequeños pasos.
          <br />
          Nuevos momentos.
        </h2>
      </div>
      <svg
        className="journey-route route-wide"
        viewBox="0 0 900 380"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M125 240 C260 240 205 115 410 155 S590 290 760 225" />
        <path
          className="route-progress"
          d="M125 240 C185 240 203 215 230 190"
        />
      </svg>
      <svg
        className="journey-route route-tall"
        viewBox="0 0 600 630"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M240 190 C530 190 440 330 330 340 S120 485 310 510" />
        <path
          className="route-progress"
          d="M240 190 C300 190 348 201 375 221"
        />
      </svg>
      <span className="garden-shape shape-one" />
      <span className="garden-shape shape-two" />
      <div className="journey-point point-one">
        <button
          onClick={() => open(0)}
          aria-label="Jugar a Encuentra las parejas"
        >
          <Grid2X2 />
        </button>
        <button className="map-bubble" onClick={() => open(0)}>
          <strong>Encuentra las parejas</strong>
          <span>Nivel 1</span>
        </button>
        <Art />
      </div>
      <div className="journey-point point-two">
        <button onClick={() => open(1)} aria-label="Jugar a Busca la figura">
          <Search />
        </button>
        <span>Busca la figura</span>
      </div>
      <div className="journey-point point-three">
        <button onClick={() => open(3)} aria-label="Jugar a Toca la diana">
          <Target />
        </button>
        <span>Toca la diana</span>
      </div>
      <p className="map-note">
        <Compass size={17} /> Puedes elegir cualquier juego
      </p>
    </div>
  );
}

export function ConceptApp({
  direction = initialDirection,
  start = initialScreen,
}) {
  const [screen, setScreen] = useState(start);
  const [gameIndex, setGameIndex] = useState(0);
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState(["Memoria"]);
  const [movement, setMovement] = useState("both");
  const [sound, setSound] = useState(true);
  const [large, setLarge] = useState(false);
  const [showPet, setShowPet] = useState(true);
  const [notice, setNotice] = useState("");
  const [paused, setPaused] = useState(false);
  const [cards, setCards] = useState([]);
  const [loginMode, setLoginMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [period, setPeriod] = useState("Esta semana");
  const mainRef = useRef(null);
  const game = games[gameIndex];
  const go = (next) => {
    setScreen(next);
    setNotice("");
    setPaused(false);
    setCards([]);
  };
  const open = (index) => {
    setGameIndex(index);
    go("intro");
  };
  useEffect(() => {
    document.title = `NeuroIA · ${directions.find((d) => d.id === direction).name}`;
    mainRef.current?.scrollTo(0, 0);
  }, [screen, direction]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  const navigation = (
    <nav className="app-nav" aria-label="Principal">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={screen === id ? "active" : ""}
          onClick={() => go(id)}
          aria-current={screen === id ? "page" : undefined}
        >
          <Icon size={23} strokeWidth={1.7} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
  const gameMode = ["intro", "game", "result"].includes(screen);
  const entryMode = ["landing", "login", "onboarding", "comfort"].includes(
    screen,
  );
  const header = (
    <header className="app-header">
      <button
        className="brand-button"
        onClick={() => go("home")}
        aria-label="NeuroIA, inicio"
      >
        <Brand />
      </button>
      <div className="header-actions">
        {!entryMode && (
          <>
            <button
              className="muse-button"
              onClick={() =>
                setNotice(
                  "Concepto · Aquí se abrirá la conexión a Muse; no se conecta ningún dispositivo.",
                )
              }
            >
              <AudioLines size={19} />
              Conectar Muse
            </button>
            <IconButton
              icon={sound ? Volume2 : Bell}
              label={sound ? "Desactivar sonido" : "Activar sonido"}
              onClick={() => setSound(!sound)}
            />
          </>
        )}
        <IconButton
          icon={Settings2}
          label="Abrir ajustes"
          onClick={() => go("settings")}
        />
      </div>
    </header>
  );
  const greeting = (
    <div className="greeting">
      <div>
        <Eyebrow>Tu espacio para practicar</Eyebrow>
        <h1>
          Hola, Lucía<span className="greeting-dot">.</span>
        </h1>
        <p>¿Qué te apetece descubrir hoy?</p>
      </div>
      <div className="streak">
        <Flame size={20} />
        <strong>3</strong>
        <span>días seguidos</span>
      </div>
    </div>
  );
  function GameCard({ item, index }) {
    return (
      <button className="game-card" onClick={() => open(index)}>
        <div className="card-art">
          <Art game={item.id} />
          <span className="small-game-glyph">
            <item.icon size={23} />
          </span>
        </div>
        <div className="card-copy">
          <span className="meta">{item.area}</span>
          <h3>{item.name}</h3>
          <span className="card-bottom">
            Ver cómo se juega
            <ArrowUpRight size={20} />
          </span>
        </div>
      </button>
    );
  }
  function renderScreen() {
    if (screen === "home")
      return (
        <>
          {greeting}
          {direction === "jardin" ? (
            <Journey open={open} direction={direction} />
          ) : (
            <div className="home-feature">
              <section className="hero">
                <div className="hero-copy">
                  <Eyebrow>
                    <span className="live-dot" />
                    Tu propuesta de hoy
                  </Eyebrow>
                  <h2>
                    {direction === "calma" ? (
                      <>
                        Un momento
                        <br />
                        para tu memoria.
                      </>
                    ) : (
                      <>
                        Tu siguiente
                        <br />
                        pequeño reto.
                      </>
                    )}
                  </h2>
                  <p>
                    Descubre las parejas.
                    <br />
                    Después, elige cómo seguir.
                  </p>
                  <Button onClick={() => open(0)}>
                    Vamos a jugar
                    <ArrowRight size={21} />
                  </Button>
                  <span className="hero-footnote">
                    Sin prisa. Puedes parar cuando quieras.
                  </span>
                </div>
                <div className="hero-visual">
                  <span className="orbit orbit-one" />
                  <span className="orbit orbit-two" />
                  <div className="game-motif" aria-hidden="true">
                    <div className="motif-card motif-back">
                      <span className="motif-flower" />
                    </div>
                    <div className="motif-card motif-front">
                      <span className="motif-flower" />
                    </div>
                    <span className="motif-dot" />
                  </div>
                  <span className="floating-tile tile-one">
                    <Grid2X2 size={30} />
                  </span>
                  <span className="floating-tile tile-two">
                    <Sparkles size={26} />
                  </span>
                </div>
              </section>
              <aside className="today-list">
                <Eyebrow>Un poco de cada</Eyebrow>
                <h3>Hoy puedes probar</h3>
                {[0, 1, 3].map((i, n) => (
                  <button key={i} onClick={() => open(i)}>
                    <span className="step-number">0{n + 1}</span>
                    <span>
                      <strong>{games[i].name}</strong>
                      <small>{games[i].area}</small>
                    </span>
                    <ArrowUpRight size={19} />
                  </button>
                ))}
                <p>
                  <CircleHelp size={16} />
                  Tú eliges por dónde empezar
                </p>
              </aside>
            </div>
          )}
          <section className="home-explore">
            <SectionTitle
              title="A tu manera"
              link="Ver los 8 juegos"
              onClick={() => go("catalog")}
            />
            <div className="area-shortcuts">
              {areas.slice(0, 3).map(({ name, icon: Icon, copy }) => (
                <button
                  key={name}
                  onClick={() => {
                    setFilter(name);
                    go("catalog");
                  }}
                >
                  <Glyph icon={Icon} />
                  <span>
                    <strong>{name}</strong>
                    <small>{copy}</small>
                  </span>
                  <ArrowUpRight size={20} />
                </button>
              ))}
            </div>
          </section>
        </>
      );
    if (screen === "catalog")
      return (
        <>
          <div className="page-heading">
            <Eyebrow>Elige lo que te apetezca</Eyebrow>
            <h1>Ocho formas de jugar.</h1>
            <p>Una actividad para cada momento.</p>
          </div>
          <div className="filter-row" aria-label="Filtrar juegos">
            {["Todos", ...areas.map((a) => a.name)].map((a) => (
              <button
                aria-pressed={filter === a}
                className={filter === a ? "selected" : ""}
                key={a}
                onClick={() => setFilter(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="game-grid">
            {games.map(
              (item, index) =>
                (filter === "Todos" || item.area === filter) && (
                  <GameCard key={item.id} item={item} index={index} />
                ),
            )}
          </div>
        </>
      );
    if (screen === "intro")
      return (
        <>
          <button className="back-link" onClick={() => go("catalog")}>
            <ArrowLeft size={19} />
            Todos los juegos
          </button>
          <div className="intro-layout">
            <div className="intro-art">
              {showPet && <Art game={game.id} />}
              <span className="intro-area">
                <game.icon size={20} />
                {game.area}
              </span>
            </div>
            <section className="intro-copy">
              <Eyebrow>Antes de empezar</Eyebrow>
              <h1>{game.name}</h1>
              <p className="lead">{game.copy}</p>
              <div className="instruction-example">
                <span>01</span>
                <p>
                  {gameIndex === 0
                    ? "Toca una carta para descubrirla."
                    : "Observa los elementos de la pantalla."}
                </p>
              </div>
              <div className="instruction-example">
                <span>02</span>
                <p>
                  {gameIndex === 0
                    ? "Busca otra que tenga el mismo objeto."
                    : "Sigue la indicación y responde a tu ritmo."}
                </p>
              </div>
              <button
                className="level-control"
                onClick={() =>
                  setNotice(
                    "Concepto · El selector conservará los diez niveles disponibles del juego.",
                  )
                }
              >
                <span>
                  Dificultad inicial<strong>Nivel 1</strong>
                </span>
                <SlidersHorizontal size={20} />
              </button>
              <Button onClick={() => go("game")}>
                Empezar a jugar
                <Play size={19} fill="currentColor" />
              </Button>
              <button
                className="listen-link"
                onClick={() =>
                  setNotice(
                    "Concepto · Escuchar utilizará la narración existente de cada juego.",
                  )
                }
              >
                <Volume2 size={18} />
                Escuchar instrucciones
              </button>
            </section>
          </div>
        </>
      );
    if (screen === "game")
      return (
        <div className="play-layout">
          <div className="play-toolbar">
            <button className="back-link" onClick={() => go("intro")}>
              <ArrowLeft size={19} />
              Salir del juego
            </button>
            <span>{game.name}</span>
            <IconButton
              icon={paused ? Play : Pause}
              label={paused ? "Continuar" : "Pausar"}
              onClick={() => setPaused(!paused)}
            />
          </div>
          <div className="play-heading">
            <Eyebrow>{game.area} · Nivel 1</Eyebrow>
            <h1>
              {paused
                ? "Tómate un momento."
                : gameIndex === 0
                  ? "Encuentra los objetos iguales."
                  : game.copy}
            </h1>
            <p>
              {paused
                ? "Tu juego te espera aquí."
                : gameIndex === 0
                  ? "Toca una carta y después otra."
                  : "Vista de concepto · elementos de ejemplo"}
            </p>
          </div>
          {paused ? (
            <div className="pause-card">
              <Moon size={48} />
              <h2>Todo a tu ritmo</h2>
              <Button onClick={() => setPaused(false)}>
                Seguir jugando
                <Play size={18} />
              </Button>
            </div>
          ) : gameIndex !== 0 ? (
            <SampleGame
              gameIndex={gameIndex}
              onAnswer={() =>
                setNotice(
                  "Muestra de interacción · La implementación conservará las reglas y respuestas del juego.",
                )
              }
            />
          ) : (
            <div className="pair-grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  className={`pair-card ${cards.includes(i) ? "flipped" : ""}`}
                  aria-label={`Carta ${i + 1}${cards.includes(i) ? ", descubierta" : ""}`}
                  onClick={() =>
                    setCards((prev) =>
                      prev.includes(i)
                        ? prev.filter((n) => n !== i)
                        : [...prev, i],
                    )
                  }
                >
                  {cards.includes(i) ? (
                    <ObjectPreview
                      symbol={["towel", "🍎", "🥕"][i % 3]}
                      label={["Toalla", "Manzana", "Zanahoria"][i % 3]}
                    />
                  ) : (
                    <span className="card-mark">
                      <Layers size={34} strokeWidth={1.3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="play-footer">
            <button
              className="text-link"
              onClick={() =>
                setNotice(
                  "Busca dos cartas con el mismo objeto. Esta es una muestra visual, no guarda resultados.",
                )
              }
            >
              <CircleHelp size={20} />
              Cómo se juega
            </button>
            <span className="quiet-progress">
              <i />
              <i />
              <i />
            </span>
            <button className="text-link" onClick={() => go("result")}>
              Ver final de muestra
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      );
    if (screen === "result")
      return (
        <div className="result-layout">
          <div className="result-art">
            {showPet ? <Art game="achievements" /> : <Trophy size={90} />}
            <span className="result-seal">
              <Check size={24} />
            </span>
          </div>
          <div className="result-copy">
            <Eyebrow>Actividad terminada</Eyebrow>
            <h1>
              Un ratito
              <br />
              bien dedicado.
            </h1>
            <p>
              Has terminado {game.name.toLowerCase()}.<br />
              Puedes seguir o dejarlo aquí por hoy.
            </p>
            <div className="result-metrics">
              <span>
                <strong>{gameIndex === 0 ? "4 de 4" : "5 de 5"}</strong>
                {gameIndex === 0
                  ? "Parejas encontradas"
                  : "Respuestas completadas"}
              </span>
              <span>
                <strong>2 min</strong>Tiempo de juego
              </span>
            </div>
            <Button onClick={() => open((gameIndex + 1) % games.length)}>
              Elegir otro juego
              <ArrowRight size={20} />
            </Button>
            <Button secondary onClick={() => go("home")}>
              Volver al inicio
            </Button>
          </div>
        </div>
      );
    if (screen === "onboarding" || screen === "comfort")
      return (
        <div className="onboard-layout">
          <aside>
            <Eyebrow>Un comienzo a tu medida</Eyebrow>
            <h2>
              Lo importante
              <br />
              es cómo
              <br />
              <em>te apetece jugar.</em>
            </h2>
            <p>
              Unas pequeñas elecciones.
              <br />
              Después, lo descubrimos jugando.
            </p>
            {showPet && <Art game="home" />}
          </aside>
          <section className="onboard-form">
            <div className="step-label">
              <span>Paso {screen === "onboarding" ? "1" : "2"} de 2</span>
              <div>
                <i />
                <i className={screen === "comfort" ? "filled" : ""} />
              </div>
            </div>
            <h1>
              {screen === "onboarding"
                ? "¿Qué te apetece practicar?"
                : "¿Cómo juegas más a gusto?"}
            </h1>
            <p>
              {screen === "onboarding"
                ? "Elige una o varias áreas."
                : "Elige una opción si te resulta útil. Es opcional."}
            </p>
            <div className="choice-list">
              {screen === "onboarding"
                ? areas.map(({ name, icon: Icon, copy }) => (
                    <label
                      key={name}
                      className={selected.includes(name) ? "checked" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(name)}
                        onChange={() =>
                          setSelected((prev) =>
                            prev.includes(name)
                              ? prev.filter((v) => v !== name)
                              : [...prev, name],
                          )
                        }
                      />
                      <Icon size={23} />
                      <span>
                        <strong>{name}</strong>
                        <small>{copy}</small>
                      </span>
                      <span className="choice-check">
                        {selected.includes(name) && <Check size={17} />}
                      </span>
                    </label>
                  ))
                : [
                    {
                      id: "both",
                      name: "Tocar y seguir",
                      copy: "Me van bien las dos formas de jugar.",
                    },
                    {
                      id: "taps",
                      name: "Prefiero dar toques",
                      copy: "Sin seguir una diana en movimiento.",
                    },
                    {
                      id: "later",
                      name: "Prefiero elegir después",
                      copy: "Puedo omitir un juego si no me resulta cómodo.",
                    },
                  ].map(({ id, name, copy }) => (
                    <label
                      key={id}
                      className={movement === id ? "checked" : ""}
                    >
                      <input
                        type="radio"
                        name="movement"
                        checked={movement === id}
                        onChange={() => setMovement(id)}
                      />
                      <span>
                        <strong>{name}</strong>
                        <small>{copy}</small>
                      </span>
                      <span className="choice-check">
                        {movement === id && <Check size={17} />}
                      </span>
                    </label>
                  ))}
            </div>
            <Button
              disabled={screen === "onboarding" && !selected.length}
              onClick={() => go(screen === "onboarding" ? "comfort" : "home")}
            >
              {screen === "onboarding" ? "Continuar" : "Preparar mis juegos"}
              <ArrowRight size={20} />
            </Button>
            <button
              className="listen-link"
              onClick={() => {
                if (screen === "onboarding") {
                  setSelected(areas.map((a) => a.name));
                  go("comfort");
                } else go("home");
              }}
            >
              {screen === "onboarding"
                ? "No sé qué elegir: explorar todas"
                : "Omitir esta preferencia"}
            </button>
            {screen === "comfort" && (
              <button className="back-link" onClick={() => go("onboarding")}>
                <ArrowLeft size={18} />
                Volver
              </button>
            )}
          </section>
        </div>
      );
    if (screen === "activity")
      return (
        <>
          <div className="page-heading heading-with-action">
            <div>
              <Eyebrow>Tu recorrido, sin comparaciones</Eyebrow>
              <h1>Cada momento cuenta.</h1>
            </div>
            <select
              aria-label="Periodo de actividad"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>Esta semana</option>
              <option>Semana anterior</option>
            </select>
          </div>
          <div className="activity-metrics">
            {(period === "Esta semana"
              ? [
                  ["5", "juegos completados"],
                  ["18", "minutos jugando"],
                  ["3", "días con actividad"],
                ]
              : [
                  ["3", "juegos completados"],
                  ["11", "minutos jugando"],
                  ["2", "días con actividad"],
                ]
            ).map(([v, t]) => (
              <section key={t}>
                <strong>{v}</strong>
                <span>{t}</span>
              </section>
            ))}
          </div>
          <div className="activity-layout">
            <section className="chart-panel">
              <SectionTitle title="Tiempo para ti" />
              <span className="meta">Minutos por día · datos de muestra</span>
              <div className="bar-chart">
                {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                  <div key={i}>
                    <span>
                      {(period === "Esta semana"
                        ? [4, 6, 8, 0, 0, 0, 0]
                        : [0, 5, 0, 6, 0, 0, 0])[i] || "—"}
                    </span>
                    <i
                      style={{
                        height:
                          (period === "Esta semana"
                            ? [4, 6, 8, 0, 0, 0, 0]
                            : [0, 5, 0, 6, 0, 0, 0])[i] *
                            13 +
                          4,
                      }}
                    />
                    <small>{d}</small>
                  </div>
                ))}
              </div>
            </section>
            <section className="milestone">
              <Glyph icon={Trophy} size={34} />
              <Eyebrow>A tu ritmo</Eyebrow>
              <h2>
                Los pequeños
                <br />
                pasos se suman.
              </h2>
              <p>Guarda aquí los recuerdos de tu recorrido.</p>
              <button className="text-link" onClick={() => go("achievements")}>
                Ver mis logros
                <ArrowUpRight size={19} />
              </button>
            </section>
          </div>
          <SectionTitle title="Últimos juegos" />
          <button className="history-row" onClick={() => go("result")}>
            <Glyph icon={Grid2X2} />
            <span>
              <strong>Encuentra las parejas</strong>
              <small>Hoy · Nivel 1 · Ejemplo</small>
            </span>
            <span>2 min</span>
            <ChevronRight size={20} />
          </button>
        </>
      );
    if (screen === "achievements")
      return (
        <>
          <button className="back-link" onClick={() => go("activity")}>
            <ArrowLeft size={18} />
            Mi actividad
          </button>
          <div className="page-heading">
            <Eyebrow>Recuerdos de tu recorrido</Eyebrow>
            <h1>Pequeños grandes pasos.</h1>
            <p>Cada logro conserva su lugar, aunque te tomes un descanso.</p>
          </div>
          <div className="achievement-grid">
            {[
              ["Tu primer paso", "Completar tu primer juego", true],
              ["Un poco de todo", "Probar las cinco áreas", false],
              ["Un hábito propio", "Volver a jugar otro día", false],
            ].map(([title, copy, earned], i) => (
              <section className={earned ? "earned" : ""} key={title}>
                <div className="badge-shape">
                  {i === 0 ? (
                    <Sparkles size={48} />
                  ) : i === 1 ? (
                    <Compass size={48} />
                  ) : (
                    <Flame size={48} />
                  )}
                </div>
                <h2>{title}</h2>
                <p>{copy}</p>
                <span>{earned ? "Conseguido · ejemplo" : "Por descubrir"}</span>
              </section>
            ))}
          </div>
        </>
      );
    if (screen === "settings")
      return (
        <>
          <div className="page-heading">
            <Eyebrow>Como te resulte más cómodo</Eyebrow>
            <h1>Tu espacio, a tu manera.</h1>
          </div>
          <div className="settings-layout">
            <div className="account-card">
              <span className="avatar">L</span>
              <h2>Lucía</h2>
              <p>Cuenta de ejemplo</p>
              <button className="text-link" onClick={() => go("login")}>
                <LogOut size={19} />
                Cerrar sesión
              </button>
            </div>
            <section className="settings-panel">
              <h2>Apariencia y sonido</h2>
              <div className="setting-row">
                <span>
                  <strong>Tamaño del texto</strong>
                  <small>Elige el que te resulte más cómodo.</small>
                </span>
                <div className="segment">
                  <button aria-pressed={!large} onClick={() => setLarge(false)}>
                    Normal
                  </button>
                  <button aria-pressed={large} onClick={() => setLarge(true)}>
                    Grande
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <span>
                  <strong>Sonidos del juego</strong>
                  <small>Puedes cambiarlos cuando quieras.</small>
                </span>
                <button
                  className={`switch ${sound ? "on" : ""}`}
                  role="switch"
                  aria-label="Sonidos del juego"
                  aria-checked={sound}
                  onClick={() => setSound(!sound)}
                >
                  <i />
                </button>
              </div>
              <div className="setting-row">
                <span>
                  <strong>Mostrar acompañantes</strong>
                  <small>Ilustraciones que dan la bienvenida.</small>
                </span>
                <button
                  className={`switch ${showPet ? "on" : ""}`}
                  role="switch"
                  aria-label="Mostrar acompañantes"
                  aria-checked={showPet}
                  onClick={() => setShowPet(!showPet)}
                >
                  <i />
                </button>
              </div>
              <h2>Tu cuenta</h2>
              <button
                className="settings-link"
                onClick={() => go("onboarding")}
              >
                <span>
                  Rehacer la prueba inicial
                  <small>Volver a elegir intereses y dificultad.</small>
                </span>
                <ChevronRight size={20} />
              </button>
              <button
                className="settings-link"
                onClick={() =>
                  setNotice(
                    "Concepto · Aquí se abrirá la suscripción mediante la pasarela existente.",
                  )
                }
              >
                <span>
                  Gestionar suscripción
                  <small>Consulta las opciones de acceso.</small>
                </span>
                <ArrowUpRight size={20} />
              </button>
              <button className="settings-link" onClick={() => go("landing")}>
                <span>Sobre NeuroIA</span>
                <ChevronRight size={20} />
              </button>
            </section>
          </div>
        </>
      );
    if (screen === "landing")
      return (
        <div className="landing-layout">
          <div>
            <Eyebrow>Juega. Practica. Progresa a tu ritmo.</Eyebrow>
            <h1>
              Jugar también
              <br />
              es una forma
              <br />
              de <em>entrenar.</em>
            </h1>
            <p>
              Pequeños juegos para practicar atención, memoria, lenguaje,
              organización y coordinación.
            </p>
            <Button
              onClick={() => {
                setLoginMode("signup");
                go("login");
              }}
            >
              Crear mi cuenta
              <ArrowRight size={20} />
            </Button>
            <button
              className="text-link"
              onClick={() => {
                setLoginMode("signin");
                go("login");
              }}
            >
              Ya tengo cuenta
              <ArrowUpRight size={18} />
            </button>
            <div className="landing-links">
              <button onClick={() => go("catalog")}>Conocer los juegos</button>
              <button
                onClick={() =>
                  setNotice(
                    "Concepto · El acceso de pago reutilizará la pasarela existente. No se realizará ningún cobro.",
                  )
                }
              >
                Ver opciones de acceso
              </button>
              <button onClick={() => go("professional")}>
                Para profesionales
              </button>
            </div>
          </div>
          <div className="landing-art">
            {showPet && <Art game="home" />}
            <span className="landing-sticker">
              <Sparkles size={18} />
              Un pequeño momento para ti
            </span>
          </div>
          <p className="product-notice">
            Entretenimiento, entrenamiento y serious play. NeuroIA no es un
            producto sanitario.
          </p>
        </div>
      );
    if (screen === "login")
      return (
        <div className="login-layout">
          <div className="login-message">
            <Eyebrow>Bienvenida a tu espacio</Eyebrow>
            <h1>
              Empieza
              <br />
              por un
              <br />
              <em>pequeño juego.</em>
            </h1>
            {showPet && <Art game="home" />}
          </div>
          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              go("onboarding");
            }}
          >
            <div className="segment">
              <button
                type="button"
                aria-pressed={loginMode === "signup"}
                onClick={() => setLoginMode("signup")}
              >
                Crear cuenta
              </button>
              <button
                type="button"
                aria-pressed={loginMode === "signin"}
                onClick={() => setLoginMode("signin")}
              >
                Iniciar sesión
              </button>
            </div>
            <h2>
              {loginMode === "signup"
                ? "Un buen comienzo."
                : "Qué bien verte de nuevo."}
            </h2>
            <p>Elige cómo quieres entrar.</p>
            <Button secondary type="button" onClick={() => go("onboarding")}>
              Continuar con Google
              <ArrowUpRight size={18} />
            </Button>
            <div className="or-divider">
              <span>o con tu correo</span>
            </div>
            <label>
              Correo electrónico
              <input
                type="email"
                required
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                required
                minLength={8}
                placeholder="Al menos 8 caracteres"
              />
            </label>
            <Button type="submit">
              {loginMode === "signup" ? "Crear mi cuenta" : "Entrar"}
              <ArrowRight size={20} />
            </Button>
            <small>Prototipo: no crea cuentas ni envía estos datos.</small>
            <button
              className="text-link"
              type="button"
              onClick={() =>
                setNotice(
                  "Concepto · La recuperación reutilizará el correo de Firebase existente.",
                )
              }
            >
              ¿Necesitas recuperar tu contraseña?
            </button>
          </form>
        </div>
      );
    if (screen === "professional")
      return (
        <>
          <div className="page-heading heading-with-action">
            <div>
              <Eyebrow>Espacio profesional · datos de muestra</Eyebrow>
              <h1>Acompañar, con claridad.</h1>
              <p>Las personas y su actividad, en un mismo lugar.</p>
            </div>
            <Button
              onClick={() =>
                setNotice(
                  "Concepto · La invitación usará los asientos y permisos existentes.",
                )
              }
            >
              <Plus size={20} />
              Invitar persona
            </Button>
          </div>
          <div className="professional-summary">
            <span>
              <strong>2</strong>Personas vinculadas
            </span>
            <span>
              <strong>1</strong>Asiento disponible
            </span>
            <button
              className="text-link"
              onClick={() =>
                setNotice(
                  "Concepto · Acceso a la gestión existente de asientos y pagos.",
                )
              }
            >
              Gestionar asientos
              <ArrowUpRight size={18} />
            </button>
          </div>
          <section className="professional-table">
            <div className="table-heading">
              <h2>Personas</h2>
              <span>Ejemplos, no pacientes reales</span>
            </div>
            {[
              ["Lucía", "L", "Hoy"],
              ["Antonio", "A", "Ayer"],
            ].map(([name, letter, last]) => (
              <div className="person-row" key={name}>
                <span className="avatar">{letter}</span>
                <span>
                  <strong>{name}</strong>
                  <small>Última actividad: {last}</small>
                </span>
                <span className="status-label">Acceso activo</span>
                <button className="text-link" onClick={() => go("activity")}>
                  Ver actividad
                  <ArrowUpRight size={18} />
                </button>
              </div>
            ))}
          </section>
          <div className="professional-note">
            <CircleHelp size={22} />
            <p>
              La actividad muestra lo que ocurre dentro de los juegos. Cada
              persona mantiene su propio ritmo.
            </p>
          </div>
        </>
      );
    return null;
  }
  return (
    <div
      className={`concept-app direction-${direction} screen-${screen} ${gameMode ? "game-mode" : ""} ${entryMode ? "entry-mode" : ""} ${large ? "large-text" : ""} ${!showPet ? "hide-companions" : ""}`}
    >
      {header}
      {!entryMode && !gameMode && navigation}
      <main ref={mainRef} className="app-main">
        {renderScreen()}
      </main>
      {notice && (
        <div className="concept-notice" role="status">
          <span>{notice}</span>
          <IconButton
            icon={X}
            label="Cerrar aviso"
            onClick={() => setNotice("")}
          />
        </div>
      )}
      <span className="demo-mark">CONCEPTO · DATOS DE MUESTRA</span>
    </div>
  );
}

function Artboard({ direction, screen, orientation, compact = false }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(900);
  const dimensions = orientation === "portrait" ? [820, 1180] : [1180, 820];
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(width / dimensions[0], 1);
  return (
    <div className={`artboard-wrapper ${compact ? "compact" : ""}`} ref={ref}>
      <div className="artboard-label">
        <span>
          {direction.letter} / {screens.find(([id]) => id === screen)[1]}
        </span>
        <span>
          {dimensions[0]} × {dimensions[1]}
        </span>
      </div>
      <div
        className="artboard-shell"
        style={{ height: dimensions[1] * scale, width: dimensions[0] * scale }}
      >
        <iframe
          title={`${direction.name} · ${screen} · ${orientation}`}
          src={`?frame&direction=${direction.id}&screen=${screen}`}
          style={{
            width: dimensions[0],
            height: dimensions[1],
            transform: `scale(${scale})`,
          }}
        />
      </div>
    </div>
  );
}

export function ConceptBoard() {
  const [direction, setDirection] = useState(initialDirection);
  const [screen, setScreen] = useState(initialScreen);
  const [orientation, setOrientation] = useState(
    params.get("orientation") === "portrait" ? "portrait" : "landscape",
  );
  const [compare, setCompare] = useState(false);
  const selected = directions.find((d) => d.id === direction);
  return (
    <div className="design-board">
      <aside className="board-sidebar">
        <a className="board-brand" href="?">
          <Brand />
          <span>DESIGN EXPLORATION / 01</span>
        </a>
        <h2>
          Una app más simple.
          <br />
          Un mundo más claro.
        </h2>
        <p className="board-intro">
          Tres direcciones. Una misma paleta azul. Tablet primero, en las dos
          orientaciones.
        </p>
        <span className="board-label">DIRECCIONES</span>
        <div className="direction-options">
          {directions.map((d) => (
            <button
              key={d.id}
              className={d.id === direction ? "active" : ""}
              onClick={() => {
                setDirection(d.id);
                setCompare(false);
              }}
            >
              <span>{d.letter}</span>
              <div>
                <strong>{d.name}</strong>
                <small>{d.short}</small>
              </div>
              {d.id === direction && <Check size={17} />}
            </button>
          ))}
        </div>
        <span className="board-label">PANTALLAS</span>
        <nav className="screen-options">
          {screens.map(([id, label], i) => (
            <button
              key={id}
              className={screen === id ? "active" : ""}
              onClick={() => setScreen(id)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="board-bottom">
          Prototipo independiente.
          <br />
          La aplicación actual sigue intacta.
        </div>
      </aside>
      <div className="board-workspace">
        <header className="board-toolbar">
          <div className="orientation-controls">
            <button
              aria-pressed={orientation === "landscape"}
              onClick={() => setOrientation("landscape")}
            >
              <Monitor size={17} />
              Horizontal
            </button>
            <button
              aria-pressed={orientation === "portrait"}
              onClick={() => setOrientation("portrait")}
            >
              <Monitor className="rotate-icon" size={17} />
              Vertical
            </button>
          </div>
          <div>
            <button
              className={compare ? "active" : ""}
              onClick={() => setCompare(!compare)}
            >
              <Grid2X2 size={17} />
              {compare ? "Ver una opción" : "Comparar las tres"}
            </button>
            <a
              href={`?frame&direction=${direction}&screen=${screen}`}
              target="_blank"
              rel="noreferrer"
            >
              <Expand size={17} />
              Abrir a tamaño real
            </a>
          </div>
        </header>
        <div className="canvas-intro">
          <div>
            <span className="board-label">
              NEUROIA / CONCEPTO {compare ? "A + B + C" : selected.letter}
            </span>
            <h1>{compare ? "Tres maneras de simplificar." : selected.name}</h1>
            <p>
              {compare
                ? "La misma pantalla y el mismo contenido. Cambia la composición, el ritmo y la navegación."
                : selected.note}
            </p>
          </div>
          <span className="concept-stage">
            Exploración visual
            <br />
            <strong>Antes de implementar</strong>
          </span>
        </div>
        <div className={`canvas ${compare ? "compare" : ""}`}>
          {(compare ? directions : [selected]).map((d) => (
            <Artboard
              key={`${d.id}-${screen}-${orientation}`}
              direction={d}
              screen={screen}
              orientation={orientation}
              compact={compare}
            />
          ))}
        </div>
        <section className="design-spec">
          <div>
            <span className="board-label">TIPOGRAFÍA</span>
            <strong>{selected.font}</strong>
            <p>
              48 / 32 / 22 / 18 / 14
              <br />
              Jerarquía breve. Texto legible.
            </p>
          </div>
          <div>
            <span className="board-label">COLOR</span>
            <div className="swatches">
              {["#F3F8FB", "#DCECF7", "#B8D8EC", "#276A93", "#173B55"].map(
                (c) => (
                  <span key={c} style={{ background: c }} title={c} />
                ),
              )}
            </div>
            <p>Azul clínico · blanco · tinta azul</p>
          </div>
          <div>
            <span className="board-label">CONTROLES</span>
            <strong>{selected.radius} / 52 px</strong>
            <p>
              Radio de superficie / acción principal.
              <br />
              Iconos Lucide, trazo de 1,7 px.
            </p>
          </div>
          <div>
            <span className="board-label">DECISIÓN DE DISEÑO</span>
            <p>{selected.tradeoff}</p>
          </div>
        </section>
        <section className="reference-section">
          <span className="board-label">
            REFERENCIAS INSPECCIONADAS EN MOBBIN
          </span>
          <div>
            <a
              href="https://mobbin.com/screens/856cdd7d-789a-4b27-b75f-779f4d36d326"
              target="_blank"
              rel="noreferrer"
            >
              Kit · espacio y navegación
              <ArrowUpRight size={16} />
            </a>
            <a
              href="https://mobbin.com/screens/bb650f80-dbb9-4af0-bb02-aa0e1b7743f3"
              target="_blank"
              rel="noreferrer"
            >
              Ahead · recorrido
              <ArrowUpRight size={16} />
            </a>
            <a
              href="https://mobbin.com/screens/8ad69ea6-81ed-4197-863d-ccba9f524a8f"
              target="_blank"
              rel="noreferrer"
            >
              Brilliant · siguiente acción
              <ArrowUpRight size={16} />
            </a>
          </div>
          <p>
            Las referencias informan la composición. El prototipo utiliza los
            recursos propios de NeuroIA; no copia pantallas ni ilustraciones de
            otras aplicaciones.
          </p>
        </section>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  isFrame ? <ConceptApp /> : <ConceptBoard />,
);
