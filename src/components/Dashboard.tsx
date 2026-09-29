import { useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Flame,
  Grid2X2,
  Home,
  Search,
  Settings2,
  Trophy,
  UserRound,
  Hand,
  Mail,
} from "lucide-react";
import { ActivityStatistics } from "./ActivityStatistics";
import { AchievementShowcase } from "./AchievementShowcase";
import { ExerciseCatalog } from "./ExerciseCatalog";
import { TabletTabs } from "./TabletTabs";
import { PracticeMotif } from "./PracticeMotif";
import { PlanButton } from "./PlanButton";
import {
  getExerciseById,
  getExercisesForDomain,
} from "../services/exerciseCatalog";
import { StorageService } from "../services/storageService";
import { soundService } from "../services/soundService";
import type {
  UserProfile,
  CognitiveDomain,
  ExerciseId,
  ExerciseResult,
} from "../types";

interface DashboardProps {
  uid: string;
  history: ExerciseResult[];
  navigationTarget?: HTMLElement | null;
  proposedSessions?: ReactNode;
  profile: UserProfile;
  onSelectDomain: (domain: CognitiveDomain) => void;
  onSelectExercise?: (exerciseId: ExerciseId) => void;
  onStartDailyPlan: (queue?: ExerciseId[]) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}
const areaNames: Record<CognitiveDomain, string> = {
  attention: "Atención",
  memory: "Memoria",
  language: "Lenguaje",
  executive: "Organización",
  motor: "Coordinación",
};
export function Dashboard({
  uid,
  history,
  navigationTarget,
  profile,
  proposedSessions,
  onSelectDomain,
  onSelectExercise,
  onStartDailyPlan,
  onOpenSettings,
  onSignOut,
  signingOut,
}: DashboardProps) {
  const [tab, setTab] = useState("today");
  const [progressTab, setProgressTab] = useState("overview");
  const [queue] = useState(() =>
    StorageService.generateDailyPlanQueue(profile).map((domain) => {
      const exercises = getExercisesForDomain(domain);
      return exercises[Math.floor(Math.random() * exercises.length)].id;
    }),
  );
  const featured = getExerciseById(queue[0])!;
  const choose = (id: ExerciseId) => {
    soundService.playTap();
    if (onSelectExercise) onSelectExercise(id);
    else onSelectDomain(getExerciseById(id)!.domain);
  };
  const today = (
    <div className="editorial-home">
      <div className="editorial-greeting">
        <div>
          <p className="editorial-eyebrow">Tu espacio para practicar</p>
          <h1>
            Hola, {profile.name}
            <span>.</span>
          </h1>
          <p>¿Qué te apetece descubrir hoy?</p>
        </div>
        <div className="editorial-streak">
          <Flame size={21} />
          <strong>{profile.streakDays}</strong>
          <span>
            {profile.streakDays === 1 ? "día seguido" : "días seguidos"}
          </span>
        </div>
      </div>
      <div className="editorial-home-grid">
        <section className="editorial-hero">
          <div className="editorial-hero-copy">
            <p className="editorial-eyebrow">
              <i />
              Tu propuesta de hoy
            </p>
            <h2>
              Un momento
              <br />
              para{" "}
              {featured.domain === "motor"
                ? "tu coordinación"
                : featured.domain === "executive"
                  ? "poner orden"
                  : `tu ${areaNames[featured.domain].toLowerCase()}`}
              .
            </h2>
            <p>
              {featured.title}.<br />
              Después, elige cómo seguir.
            </p>
            <button
              className="touch-btn touch-btn-primary"
              onClick={() => choose(featured.id)}
            >
              Vamos a jugar
              <ArrowRight size={21} />
            </button>
          </div>
          <PracticeMotif />
        </section>
        <aside className="editorial-today">
          <p className="editorial-eyebrow">Un poco de cada</p>
          <h2>Hoy puedes probar</h2>
          {queue.map((id, index) => {
            const game = getExerciseById(id)!;
            return (
              <button key={id} onClick={() => choose(id)}>
                <span className="editorial-step">0{index + 1}</span>
                <span>
                  <strong>{game.title}</strong>
                  <small>{areaNames[game.domain]}</small>
                </span>
                <ArrowUpRight size={19} />
              </button>
            );
          })}
          <button
            className="editorial-daily-start"
            onClick={() => onStartDailyPlan(queue)}
          >
            {profile.dailyPlanCompletedToday
              ? "Hacer otra sesión"
              : "Jugar la sesión de hoy"}
            <ArrowRight size={18} />
          </button>
        </aside>
      </div>
      <section className="editorial-explore">
        <div className="editorial-section-heading">
          <h2>A tu manera</h2>
          <button className="text-link" onClick={() => setTab("games")}>
            Ver los 8 juegos
            <ArrowUpRight size={19} />
          </button>
        </div>
        <div className="editorial-areas">
          {[
            {
              domain: "attention",
              title: "Atención",
              copy: "Observar y encontrar",
              icon: Search,
            },
            {
              domain: "memory",
              title: "Memoria",
              copy: "Recordar y relacionar",
              icon: Brain,
            },
            {
              domain: "motor",
              title: "Coordinación",
              copy: "Tocar y seguir",
              icon: Hand,
            },
          ].map(({ domain, title, copy, icon: Icon }) => (
            <button
              key={domain}
              onClick={() => onSelectDomain(domain as CognitiveDomain)}
            >
              <span className="editorial-glyph">
                <Icon size={25} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{copy}</small>
              </span>
              <ArrowUpRight size={20} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
  return (
    <div className="dashboard-container editorial-dashboard">
      <TabletTabs
        navigationTarget={navigationTarget}
        label="Tu espacio"
        value={tab}
        onChange={setTab}
        tabs={[
          {
            id: "today",
            label: "Hoy",
            icon: <Home size={22} />,
            content: today,
          },
          {
            id: "games",
            label: "Juegos",
            icon: <Grid2X2 size={22} />,
            content: (
              <ExerciseCatalog
                embedded
                profile={profile}
                onBack={() => setTab("today")}
                onSelectExercise={(exercise) => choose(exercise.id)}
              />
            ),
          },
          ...(proposedSessions
            ? [
                {
                  id: "proposals",
                  label: "Para ti",
                  icon: <Mail size={22} />,
                  content: proposedSessions,
                },
              ]
            : []),
          {
            id: "progress",
            label: "Actividad",
            icon: <Activity size={22} />,
            content: (
              <ActivityStatistics
                levels={profile.gameLevels}
                selectedTab={progressTab}
                onTabChange={setProgressTab}
                uid={uid}
                history={history}
                embedded
                onBack={() => setTab("today")}
                achievements={
                  <AchievementShowcase
                    profile={profile}
                    embedded
                    onBack={() => setTab("today")}
                  />
                }
              />
            ),
          },
          {
            id: "account",
            label: "Mi cuenta",
            icon: <UserRound size={22} />,
            content: (
              <section className="account-overview">
                <p className="editorial-eyebrow">Como te resulte más cómodo</p>
                <h1>Tu espacio, a tu manera.</h1>
                <div className="account-overview-grid">
                  <div className="account-identity">
                    <span className="account-initial" aria-hidden="true">
                      {Array.from(profile.name)[0]}
                    </span>
                    <h2>{profile.name}</h2>
                    <button
                      className="text-link"
                      disabled={signingOut}
                      onClick={onSignOut}
                    >
                      {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
                    </button>
                  </div>
                  <div className="account-choices">
                    <button onClick={onOpenSettings}>
                      <Settings2 size={24} />
                      <span>
                        <strong>Ajustes</strong>
                        <small>Texto, apariencia y datos de tu cuenta</small>
                      </span>
                      <ArrowUpRight size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setProgressTab("achievements");
                        setTab("progress");
                      }}
                    >
                      <Trophy size={24} />
                      <span>
                        <strong>Tus logros</strong>
                        <small>Pequeños pasos que conservan su lugar</small>
                      </span>
                      <ArrowUpRight size={20} />
                    </button>
                    <PlanButton detailed />
                  </div>
                </div>
              </section>
            ),
          },
        ]}
      />
    </div>
  );
}
