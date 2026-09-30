import { localDay } from '../services/activityStats';
import { useState, type ReactNode } from "react";
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
  profile: UserProfile;
  onSelectDomain: (domain: CognitiveDomain) => void;
  onSelectExercise?: (exerciseId: ExerciseId) => void;
  onStartDailyPlan: (queue?: ExerciseId[]) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}
export function Dashboard({
  uid,
  history,
  navigationTarget,
  selectedTab,
  onTabChange,
  profile,
  proposedSessions,
  onSelectDomain,
  onSelectExercise,
  onStartDailyPlan,
  onOpenSettings,
  onSignOut,
  signingOut,
}: DashboardProps) {
  const [localTab, setLocalTab] = useState("today");
  const tab = selectedTab ?? localTab;
  const setTab = onTabChange ?? setLocalTab;
  const [progressTab, setProgressTab] = useState("overview");
  const session = dailySession(uid);
  const queue = session.games;
  const todayKey = localDay(new Date().toISOString());
  const completedToday = new Set(history.filter(result => !result.practice && localDay(result.date) === todayKey).map(result => result.exerciseId));
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
              Para hoy
            </p>
            <h2>{session.title}</h2>
            <button
              className="touch-btn touch-btn-primary"
              onClick={() => onStartDailyPlan([...queue])}
            >
              Jugar
              <ArrowRight size={21} />
            </button>
          </div>
          <PracticeMotif />
        </section>
        <aside className="editorial-today">
          <h2>Tu sesión de hoy</h2>
          <div className="editorial-today-games">
          {queue.map((id, index) => {
            const game = getExerciseById(id)!;
            return (
              <button key={id} onClick={() => choose(id)}>
                <span className="editorial-step">0{index + 1}</span>
                <span>
                  <strong>{game.title}</strong>
                </span>
                {completedToday.has(id) ? <><Check size={19} aria-hidden="true"/><span className="sr-only">Completado hoy</span></> : <ArrowUpRight size={19} aria-hidden="true"/>}
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
