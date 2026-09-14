import type { ReactNode } from 'react';
import type { ExerciseId } from '../types';

// One drawing per exercise: the symbol describes its actual interaction.
const illustrations: Record<ExerciseId, ReactNode> = {
  'visual-scanning': <>
    <path d="M10 51Q47 4 88 49Q50 96 10 51Z" fill="currentColor" fillOpacity=".12" />
    <path d="M10 51Q47 4 88 49Q50 96 10 51Z" />
    <ellipse cx="49" cy="50" rx="17" ry="21" fill="currentColor" />
    <circle cx="54" cy="43" r="5" fill="var(--panel-blue)" stroke="none" />
    <path d="M24 21L19 13M48 14V6M72 21L78 13" />
  </>,
  'language-naming': <>
    <path d="M16 18Q48 10 80 18Q91 23 87 51Q86 64 68 66L46 65L28 81L30 63Q12 61 12 45Q9 24 16 18Z" fill="currentColor" fillOpacity=".12" />
    <path d="M16 18Q48 10 80 18Q91 23 87 51Q86 64 68 66L46 65L28 81L30 63Q12 61 12 45Q9 24 16 18Z" />
    <path d="M33 49L46 27L59 49M38 41H54M67 32V43" />
    <circle cx="67" cy="50" r="2" fill="currentColor" stroke="none" />
  </>,
  'word-completion': <>
    <rect x="9" y="24" width="35" height="46" rx="9" transform="rotate(-8 26 47)" fill="currentColor" fillOpacity=".14" />
    <path d="M19 56L27 35L35 55M22 49H32" />
    <rect x="53" y="26" width="35" height="46" rx="9" strokeDasharray="5 6" />
    <path d="M64 50H77M71 43V57M33 83Q55 95 72 80" />
  </>,
  'memory-path': <>
    <path d="M23 24C84 0 89 48 53 50C10 50 8 81 75 80" strokeDasharray="4 7" />
    <circle cx="23" cy="24" r="12" fill="currentColor" />
    <circle cx="53" cy="50" r="12" fill="var(--panel-lilac)" />
    <circle cx="75" cy="80" r="12" fill="currentColor" fillOpacity=".25" />
    <path d="M21 19V29M49 47Q58 42 55 49L50 54H57M72 75Q81 73 76 79Q83 83 72 85" stroke="var(--panel-lilac)" />
    <path d="M49 47Q58 42 55 49L50 54H57M72 75Q81 73 76 79Q83 83 72 85" />
  </>,
  'memory-pairs': <>
    <rect x="12" y="19" width="34" height="59" rx="10" transform="rotate(-9 29 49)" fill="currentColor" fillOpacity=".12" />
    <rect x="54" y="19" width="34" height="59" rx="10" transform="rotate(9 71 49)" fill="currentColor" fillOpacity=".12" />
    <path d="M20 45C17 35 28 34 29 42C36 32 43 44 29 57C26 54 22 50 20 45ZM62 45C59 35 70 34 71 42C78 32 85 44 71 57C68 54 64 50 62 45Z" fill="currentColor" stroke="none" />
  </>,
  'daily-sequencing': <>
    <path d="M13 85V64H35V42H57V20H79" />
    <path d="M18 71H28M41 49H51M63 27H73" />
    <path d="M17 42Q28 15 57 12M49 6L59 11L53 21" />
    <circle cx="79" cy="20" r="10" fill="currentColor" />
    <path d="M25 85H85" strokeOpacity=".3" />
  </>,
  'categorization': <>
    <path d="M9 56H44L40 84H14ZM56 56H91L86 84H61Z" fill="currentColor" fillOpacity=".15" />
    <circle cx="22" cy="26" r="10" fill="currentColor" />
    <circle cx="37" cy="44" r="6" fill="currentColor" fillOpacity=".5" />
    <path d="M72 12L85 34H59Z" fill="currentColor" />
    <path d="M77 40L84 51H70Z" fill="currentColor" fillOpacity=".5" />
  </>,
  'motor-target': <>
    <ellipse cx="48" cy="48" rx="34" ry="33" fill="currentColor" fillOpacity=".1" />
    <ellipse cx="48" cy="48" rx="21" ry="20" />
    <circle cx="48" cy="48" r="7" fill="currentColor" />
    <path d="M59 60L81 71L70 75L66 87Z" fill="var(--panel-peach)" />
    <path d="M48 7V14M7 48H14M81 48H90" />
  </>,
  'motor-tracking': <>
    <path d="M10 74C35 93 53 61 30 48C6 33 28 6 55 26C72 41 83 25 84 13" strokeDasharray="5 6" />
    <circle cx="11" cy="74" r="5" fill="currentColor" />
    <circle cx="55" cy="26" r="11" fill="currentColor" fillOpacity=".2" />
    <path d="M77 15L85 9L91 18M56 45L75 56L65 60L61 71Z" fill="var(--panel-peach)" />
  </>,
};

export function WellnessGlyph({ exercise }: { exercise: ExerciseId }) {
  return <svg className="wellness-glyph" data-exercise-icon={exercise} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {illustrations[exercise]}
  </svg>;
}
