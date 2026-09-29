import type { ReactNode } from 'react';
import type { ExerciseId } from '../types';

// Decorative introduction artwork. These compositions are not playable stimuli.
const blue = 'var(--color-primary)';
const pale = 'var(--color-primary-light)';
const paper = 'var(--color-surface)';
const drawings: Record<ExerciseId, ReactNode> = {
  'visual-scanning': <>
    <rect x="44" y="50" width="190" height="184" rx="22" fill={paper} transform="rotate(-6 139 142)"/>
    {[0,1,2].flatMap(row => [0,1,2].map(col => <circle key={`${row}-${col}`} cx={83+col*54} cy={88+row*53} r="11" fill={row===1 && col===1 ? blue : pale}/>))}
    <circle cx="167" cy="155" r="46" fill={paper} fillOpacity=".5" stroke={blue} strokeWidth="12"/>
    <path d="M202 191L238 232" stroke={blue} strokeWidth="18" strokeLinecap="round"/>
    <circle cx="166" cy="153" r="13" fill={blue}/>
  </>,
  'language-naming': <>
    <rect x="39" y="93" width="140" height="151" rx="20" fill={paper} transform="rotate(-8 109 169)"/>
    <path d="M108 140C65 122 60 183 95 204Q107 212 119 202C156 209 171 138 135 137Q120 135 108 140Z" fill={blue}/>
    <path d="M115 139Q111 119 124 111M123 122Q146 98 156 117Q143 136 123 122" fill={blue} stroke={blue} strokeWidth="5" strokeLinecap="round"/>
    <path d="M162 44H236Q257 44 257 65V112Q257 132 236 132H204L181 152V132H162Q143 132 143 112V65Q143 44 162 44Z" fill={blue}/>
    <path d="M170 99L185 70L200 99M176 89H194M216 74V89" stroke={paper} strokeWidth="5" fill="none" strokeLinecap="round"/><circle cx="216" cy="100" r="3" fill={paper}/>
  </>,
  'word-completion': <>
    <path d="M58 193Q146 250 239 185" stroke={blue} strokeOpacity=".25" strokeWidth="3" fill="none"/>
    <rect x="33" y="90" width="72" height="99" rx="13" fill={paper} transform="rotate(-9 69 139)"/>
    <rect x="118" y="90" width="72" height="99" rx="13" fill="none" stroke={blue} strokeWidth="3" strokeDasharray="7 8"/>
    <rect x="203" y="90" width="63" height="99" rx="13" fill={paper} transform="rotate(8 234 139)"/>
    <path d="M82 120C51 103 44 133 66 139C92 146 76 169 51 157M222 119V157H247" fill="none" stroke={blue} strokeWidth="7" strokeLinecap="round"/>
    <g transform="rotate(10 156 65)"><rect x="122" y="24" width="64" height="77" rx="12" fill={blue}/><ellipse cx="154" cy="63" rx="15" ry="22" fill="none" stroke={paper} strokeWidth="6"/></g>
    <path d="M153 121V159M140 146L153 159L166 146" stroke={blue} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </>,
  'memory-path': <>
    <path d="M83 86H218V215H82" fill="none" stroke={blue} strokeOpacity=".4" strokeWidth="4" strokeDasharray="6 10" strokeLinecap="round"/>
    <rect x="40" y="42" width="86" height="86" rx="22" fill={blue} transform="rotate(-7 83 85)"/>
    <rect x="175" y="42" width="86" height="86" rx="22" fill={paper} transform="rotate(6 218 85)"/>
    <rect x="175" y="171" width="86" height="86" rx="22" fill={blue} opacity=".6" transform="rotate(-5 218 214)"/>
    <circle cx="83" cy="85" r="18" fill={paper}/><circle cx="218" cy="85" r="18" fill={blue}/><circle cx="218" cy="214" r="18" fill={paper}/>
    <circle cx="82" cy="215" r="14" fill="none" stroke={blue} strokeWidth="3"/>
    <path d="M56 17L51 7M85 14V3M111 21L120 12" stroke={blue} strokeWidth="3" strokeLinecap="round"/>
  </>,
  'memory-pairs': <>
    <rect x="43" y="51" width="99" height="157" rx="17" fill={blue} opacity=".22" transform="rotate(-14 92 129)"/>
    <g transform="rotate(-7 101 159)"><rect x="51" y="77" width="99" height="157" rx="17" fill={paper}/><path d="M101 183C38 138 88 117 101 144C117 116 162 141 101 183Z" fill={blue}/></g>
    <g transform="rotate(9 212 145)"><rect x="163" y="63" width="99" height="157" rx="17" fill={blue}/><path d="M213 169C150 124 200 103 213 130C229 102 274 127 213 169Z" fill={paper}/></g>
  </>,
  categorization: <>
    <path d="M32 169H136L124 250H45ZM166 169H270L256 250H178Z" fill={paper}/>
    <path d="M47 187H121M181 187H255" stroke={blue} strokeOpacity=".3" strokeWidth="4" strokeLinecap="round"/>
    <circle cx="73" cy="75" r="27" fill={blue}/><circle cx="112" cy="129" r="17" fill={blue} opacity=".6"/>
    <path d="M217 43L251 101H183Z" fill={blue}/><path d="M184 120L203 153H165Z" fill={blue} opacity=".6"/>
    <circle cx="85" cy="218" r="12" fill={blue}/><path d="M219 205L233 229H205Z" fill={blue}/>
  </>,
  'motor-target': <>
    <circle cx="142" cy="139" r="99" fill={paper}/><circle cx="142" cy="139" r="72" fill={blue}/><circle cx="142" cy="139" r="45" fill={paper}/><circle cx="142" cy="139" r="19" fill={blue}/>
    <path d="M178 177L249 203L221 215L209 244Z" fill={blue} stroke={paper} strokeWidth="5" strokeLinejoin="round"/>
    <path d="M142 15V27M20 139H32M250 139H262" stroke={blue} strokeWidth="4" strokeLinecap="round"/>
  </>,
  'motor-tracking': <>
    <path d="M44 226C160 283 232 177 125 155C18 133 73 38 167 72C232 97 258 59 250 29" fill="none" stroke={paper} strokeWidth="24" strokeLinecap="round"/>
    <path d="M44 226C160 283 232 177 125 155C18 133 73 38 167 72C232 97 258 59 250 29" fill="none" stroke={blue} strokeOpacity=".5" strokeWidth="3" strokeDasharray="5 9" strokeLinecap="round"/>
    <circle cx="44" cy="226" r="12" fill={blue}/><circle cx="169" cy="73" r="31" fill={blue}/><circle cx="169" cy="73" r="14" fill={paper}/>
    <path d="M184 108L237 137L211 147L202 173Z" fill={blue} stroke={paper} strokeWidth="4" strokeLinejoin="round"/>
  </>,
};

export function ExerciseIllustration({ exercise }: { exercise: ExerciseId }) {
  return <svg className="exercise-illustration" data-illustration={exercise} viewBox="0 0 300 300" aria-hidden="true" focusable="false">
    {drawings[exercise]}
  </svg>;
}
