import { visibleSessionSteps, type AssignedSession } from '../services/assignedSessions';
import { DIFFICULTY_VERSION } from '../services/difficulty';
import { localDay } from '../services/activityStats';
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  Check,
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
} from "../services/exerciseCatalog";
import { dailySession } from "../services/dailySession";
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
  selectedTab?: string;
  onTabChange?: (tab: string) => void;
  proposedSessions?: ReactNode;
  recommendation?: { session: AssignedSession; completed: ReadonlySet<number> };
  onStartRecommendation?: (session: AssignedSession, step?: number) => void;
  profile: UserProfile;
  onSelectDomain: (domain: CognitiveDomain) => void;
  onSelectExercise?: (exerciseId: ExerciseId) => void;
  onStartDailyPlan: (queue?: ExerciseId[]) => void;
  onOpenSettings: () => void;
}
export function Dashboard({
  uid,
  history,
  navigationTarget,
  selectedTab,
  onTabChange,
  profile,
  proposedSessions,
  recommendation,
  onStartRecommendation,
  onSelectDomain,
  onSelectExercise,
  onStartDailyPlan,
  onOpenSettings,
}: DashboardProps) {
  const container = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element || !navigationTarget) return;
    const measure = () => element.style.setProperty('--dashboard-navigation-height', `${navigationTarget.getBoundingClientRect().height}px`);
    const observer = new ResizeObserver(measure);
    observer.observe(navigationTarget);
    measure();
    return () => {
      observer.disconnect();
      element.style.removeProperty('--dashboard-navigation-height');
    };
  }, [navigationTarget]);
  const [localTab, setLocalTab] = useState("today");
  const tab = selectedTab ?? localTab;
  const setTab = onTabChange ?? setLocalTab;
  const [progressTab, setProgressTab] = useState("overview");
  const session = dailySession(uid);
  const queue = recommendation?.session.steps.map(step => step.exerciseId) ?? session.games;
  const todayKey = localDay(new Date().toISOString());
  const completedToday = new Set(history.filter(result => !result.practice && localDay(result.date) === todayKey).map(result => result.exerciseId));
  const completed = recommendation?.completed ?? new Set(queue.flatMap((id, index) => completedToday.has(id) ? [index] : []));
  const visible = visibleSessionSteps(queue.length, completed);
  const allDone = completed.size === queue.length;
  const choose = (id: ExerciseId) => {
    soundService.playTap();
    if (onSelectExercise) onSelectExercise(id);
    else onSelectDomain(getExerciseById(id)!.domain);
  };
  const today = (
    <div className="editorial-home">
      <div className="editorial-greeting">
        <div>
          <h1>
            Hola, {profile.name}
            <span>.</span>
          </h1>
        </div>
        <div className="editorial-streak">
          <Flame size={21} fill={completedToday.size > 0 ? "currentColor" : "none"} />
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
              {recommendation ? `Propuesta de ${recommendation.session.professionalName}` : 'Para hoy'}
            </p>
            <h2>{recommendation?.session.title ?? session.title}</h2>
            <button
              className="touch-btn touch-btn-primary"
              disabled={!!recommendation && (allDone || recommendation.session.configVersion !== DIFFICULTY_VERSION)}
              onClick={() => recommendation ? onStartRecommendation?.(recommendation.session) : onStartDailyPlan([...queue])}
            >
              {recommendation && allDone ? 'Sesión completada' : 'Jugar'}
              <ArrowRight size={21} />
            </button>
          </div>
          <PracticeMotif />
        </section>
        <aside className="editorial-today">
          <h2>Tu sesión de hoy</h2>
          <div className="editorial-today-games">
          {visible.map(index => {
            const id = queue[index];
            const game = getExerciseById(id)!;
            return (
              <button key={index} disabled={!!recommendation && (completed.has(index) || recommendation.session.configVersion !== DIFFICULTY_VERSION)} onClick={() => recommendation ? onStartRecommendation?.(recommendation.session, index) : choose(id)}>
                <span className="editorial-step">0{index + 1}</span>
                <span>
                  <strong>{game.title}</strong>
                </span>
                {completed.has(index) ? <><Check size={19} aria-hidden="true"/><span className="sr-only">{recommendation ? 'Completado' : 'Completado hoy'}</span></> : <ArrowUpRight size={19} aria-hidden="true"/>}
              </button>
            );
          })}
          </div>
        </aside>
      </div>
      <section className="editorial-explore">
        <div className="editorial-section-heading">
          <h2>Explorar</h2>
          <button className="text-link" onClick={() => setTab("games")}>
            Ver todos
            <ArrowUpRight size={19} />
          </button>
        </div>
        <div className="editorial-areas">
          {[
            {
              domain: "attention",
              title: "Atención",
              icon: Search,
            },
            {
              domain: "memory",
              title: "Memoria",
              icon: Brain,
            },
            {
              domain: "motor",
              title: "Coordinación",
              icon: Hand,
            },
          ].map(({ domain, title, icon: Icon }) => (
            <button
              key={domain}
              onClick={() => onSelectDomain(domain as CognitiveDomain)}
            >
              <span className="editorial-glyph">
                <Icon size={25} />
              </span>
              <span>
                <strong>{title}</strong>
              </span>
              <ArrowUpRight size={20} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
  return (
    <div ref={container} className="dashboard-container editorial-dashboard">
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
                active={tab === 'progress'}
                tapsOnly={profile.placement?.preferences?.movement === 'taps'}
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
                <header className="workspace-section-heading">
                  <span className="workspace-section-icon" aria-hidden="true"><Settings2 size={26}/></span>
                  <div><h1>Mi cuenta</h1><p>Ajustes y acceso a NeuroIA.</p></div>
                </header>
                  <div className="account-choices">
                    <button onClick={onOpenSettings}>
                      <Settings2 size={24} />
                      <span>
                        <strong>Ajustes</strong>
                        <small>Texto, apariencia y datos de tu cuenta</small>
                      </span>
                      <ArrowUpRight size={20} />
                    </button>
                    <button onClick={() => { setProgressTab("overview"); setTab("progress"); }}>
                      <Activity size={24}/><span><strong>Tu actividad</strong><small>Historial, gráficas y niveles</small></span><ArrowUpRight size={20}/>
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
                        <small>Consulta tus logros y su progreso</small>
                      </span>
                      <ArrowUpRight size={20} />
                    </button>
                    <PlanButton detailed />
                  </div>
              </section>
            ),
          },
        ]}
      />
    </div>
  );
}
