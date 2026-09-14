/** Organic editorial symbols for the wellness cards; decorative, never labels. */
export function WellnessGlyph({ variant = 0 }: { variant?: number }) {
  return <svg className="wellness-glyph" viewBox="0 0 100 100" fill="none" aria-hidden="true">
    {variant % 3 === 0 ? <>
      <path d="M50 33C26 3 12 28 33 46C1 45 9 73 37 63C23 93 53 100 57 69C77 92 98 69 72 54C105 42 85 17 62 37C68 6 39 5 50 33Z" fill="currentColor" />
      <ellipse cx="51" cy="52" rx="10" ry="11" fill="var(--glyph-center, #edcde7)" />
    </> : variant % 3 === 1 ? <>
      <path d="M21 72C12 82 26 91 52 89C78 89 90 80 78 70C65 61 35 62 21 72Z" fill="currentColor" fillOpacity=".3" stroke="currentColor" strokeWidth="2" />
      <path d="M27 54C17 64 29 73 54 72C77 71 84 61 74 53C63 44 38 45 27 54Z" fill="currentColor" fillOpacity=".5" stroke="currentColor" strokeWidth="2" />
      <path d="M36 34C23 45 33 55 54 54C76 53 77 41 66 34C57 28 45 27 36 34Z" fill="currentColor" fillOpacity=".7" stroke="currentColor" strokeWidth="2" />
      <path d="M43 13C32 20 39 34 53 32C70 30 69 20 60 14C54 10 49 10 43 13Z" fill="currentColor" />
    </> : <>
      <path d="M50 84C48 48 52 29 53 13M50 64C27 64 15 46 15 36C37 36 49 49 50 64ZM51 49C72 47 84 28 84 18C64 20 53 32 51 49ZM50 83C69 83 82 67 83 57C63 58 52 70 50 83Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>}
  </svg>;
}
